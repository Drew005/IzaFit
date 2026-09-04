// =============================================================================
// WEBHOOK — Mercado Pago
// =============================================================================
// O Mercado Pago envia notificações de mudança de status de pagamento para
// esta rota. O endpoint SEMPRE retorna 200 OK (mesmo em caso de erro) para
// evitar retentativas infinitas.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateWebhookSignature,
  getMercadoPagoPayment,
} from "@/lib/mercadopago";
import { StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Mapeamento dos status do Mercado Pago para o nosso sistema.
const STATUS_MAP: Record<string, string> = {
  approved: "PAID",
  authorized: "PAID",
  pending: "PENDING",
  in_process: "PENDING",
  inmediatelly: "PENDING",
  cancelled: "CANCELED",
  denied: "CANCELED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  approved: "APPROVED",
  authorized: "APPROVED",
  pending: "PENDING",
  in_process: "PENDING",
  cancelled: "DENIED",
  denied: "DENIED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    // Validação de assinatura (se configurada)
    if (!validateWebhookSignature(body, signature)) {
      console.error("[Webhook MP] Assinatura inválida");
      return NextResponse.json({ ok: true }); // 200 mesmo com erro
    }

    const payload = JSON.parse(body);
    const action = payload.action as string | undefined;
    const paymentId = payload.data?.id;

    // Apenas processamos notificações de pagamento
    if (action !== "payment.created" && action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // Busca os dados atualizados do pagamento
    const mpPayment = await getMercadoPagoPayment(paymentId);
    if (!mpPayment) {
      return NextResponse.json({ ok: true });
    }

    // Localiza o pagamento interno pelo gatewayId (campo mais confiável).
    const internalPayment = await prisma.payment.findUnique({
      where: { gatewayId: String(paymentId) },
      select: { orderId: true },
    });

    // Fallback: usa o external_reference (orderId) quando o gatewayId não confere.
    const resolvedOrderId =
      internalPayment?.orderId ??
      (payload.data?.external_reference as string | undefined) ??
      "";

    const order = await prisma.order.findUnique({
      where: { id: resolvedOrderId },
      include: { payments: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ ok: true });
    }

    const orderId = order.id;

    const newOrderStatus = STATUS_MAP[mpPayment.status] as
      | "PENDING"
      | "PAID"
      | "CANCELED"
      | "REFUNDED"
      | undefined;
    const newPaymentStatus = PAYMENT_STATUS_MAP[mpPayment.status] as
      | "PENDING"
      | "APPROVED"
      | "DENIED"
      | "REFUNDED"
      | undefined;

    if (!newOrderStatus || !newPaymentStatus) {
      return NextResponse.json({ ok: true });
    }

    // Transação para atualizar pedido + pagamento
    await prisma.$transaction(async (tx) => {
      // Atualiza status do pedido
      await tx.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus },
      });

      // Atualiza status do pagamento
      const payment = order.payments[0];
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: newPaymentStatus,
            paidAt: newPaymentStatus === "APPROVED" ? new Date() : null,
          },
        });
      }

      // Se aprovado: baixar estoque e dar pontos de fidelidade
      if (newOrderStatus === "PAID") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: StockMovementType.SALE_OUT,
              quantity: item.quantity,
              reason: `Venda online (pedido ${orderId.slice(-6)})`,
              referenceId: orderId,
            },
          });
        }

        // Brindes — debita estoque
        const orderGifts = await tx.orderGift.findMany({
          where: { orderId },
        });
        for (const og of orderGifts) {
          await tx.gift.updateMany({
            where: { id: og.giftId, stockQuantity: { gt: 0 } },
            data: { stockQuantity: { decrement: og.quantity } },
          });
        }

        // Pontos de fidelidade (1 ponto a cada R$ 10)
        if (order.customerId) {
          const earnedPoints = Math.floor(Number(order.total) / 10);
          if (earnedPoints > 0) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: { loyaltyPoints: { increment: earnedPoints } },
            });
          }
        }
      }

      // Se cancelado/devolvido: restaurar estoque (se estava pago antes)
      const wasPaid = ["PAID", "SHIPPED", "COMPLETED"].includes(order.status);
      const nowCanceled = ["CANCELED", "REFUNDED"].includes(newOrderStatus);

      if (wasPaid && nowCanceled) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: StockMovementType.RETURN_IN,
              quantity: item.quantity,
              reason: `Cancelamento via webhook Mercado Pago (pedido ${orderId.slice(-6)})`,
              referenceId: orderId,
            },
          });
        }

        // Restaurar brindes
        const orderGifts = await tx.orderGift.findMany({
          where: { orderId },
        });
        for (const og of orderGifts) {
          await tx.gift.update({
            where: { id: og.giftId },
            data: { stockQuantity: { increment: og.quantity } },
          });
        }

        // Remover pontos de fidelidade
        if (order.customerId) {
          const earnedPoints = Math.floor(Number(order.total) / 10);
          if (earnedPoints > 0) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: { loyaltyPoints: { decrement: earnedPoints } },
            });
          }
        }
      }
    });

    // Revalidar caches
    revalidatePath("/admin/vendas");
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/estoque");
    revalidatePath("/admin");
    revalidatePath("/perfil");

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log do erro mas SEMPRE retorna 200 para o Mercado Pago não reenviar
    console.error("[Webhook MP] Erro ao processar notificação:", error);
    return NextResponse.json({ ok: true });
  }
}
