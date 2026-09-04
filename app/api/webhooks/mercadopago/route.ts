// =============================================================================
// WEBHOOK — Mercado Pago Orders API
// =============================================================================
// O Mercado Pago envia notificações de criação/alteração de Orders para esta
// rota. A rota consulta a Order diretamente na API antes de alterar o pedido
// interno, sem confiar no status enviado pelo webhook.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMercadoPagoOrderStatus,
  getMercadoPagoPayment,
  validateWebhookSignature,
} from "@/lib/mercadopago";
import { StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const ORDER_STATUS_MAP: Record<string, "PENDING" | "PAID" | "CANCELED" | "REFUNDED"> = {
  processed: "PAID",
  approved: "PAID",
  authorized: "PAID",
  pending: "PENDING",
  action_required: "PENDING",
  in_process: "PENDING",
  inmediatelly: "PENDING",
  cancelled: "CANCELED",
  canceled: "CANCELED",
  denied: "CANCELED",
  rejected: "CANCELED",
  failed: "CANCELED",
  expired: "CANCELED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

const PAYMENT_STATUS_MAP: Record<string, "PENDING" | "APPROVED" | "DENIED" | "REFUNDED"> = {
  processed: "APPROVED",
  approved: "APPROVED",
  authorized: "APPROVED",
  pending: "PENDING",
  action_required: "PENDING",
  in_process: "PENDING",
  inmediatelly: "PENDING",
  cancelled: "DENIED",
  canceled: "DENIED",
  denied: "DENIED",
  rejected: "DENIED",
  failed: "DENIED",
  expired: "DENIED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

type MercadoPagoWebhookPayload = {
  action?: string;
  type?: string;
  data?: {
    id?: string;
    order_id?: string;
    external_reference?: string;
  };
};

type GatewayMeta = {
  mpOrderId?: unknown;
};

function getMetaOrderId(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const meta = value as GatewayMeta;
  return typeof meta.mpOrderId === "string" ? meta.mpOrderId : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");
    const requestId = request.headers.get("x-request-id");

    let payload: MercadoPagoWebhookPayload;
    try {
      payload = JSON.parse(body) as MercadoPagoWebhookPayload;
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    // A documentação do Mercado Pago envia data.id também na query string.
    // O fallback para o body permite testar manualmente e tolera variações do payload.
    const dataId =
      request.nextUrl.searchParams.get("data.id") ?? payload.data?.id ?? null;

    if (!validateWebhookSignature(body, signature, requestId, dataId)) {
      console.error("[Webhook MP] Assinatura inválida");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const mpId = payload.data?.id;
    if (!mpId) return NextResponse.json({ ok: true });

    const isOrderNotification = payload.type === "order" || mpId.startsWith("ORD");
    const isPaymentNotification = payload.type === "payment" || !isOrderNotification;

    // Localiza o pagamento interno pelo payment ID ou pela order ID do Mercado Pago.
    // O gatewayId novo guarda PAY..., enquanto mpOrderId fica em gatewayMeta.
    let internalPayment = await prisma.payment.findFirst({
      where: { gatewayId: mpId },
      select: { id: true, orderId: true, gatewayMeta: true },
    });

    if (!internalPayment && isOrderNotification) {
      internalPayment = await prisma.payment.findFirst({
        where: {
          gatewayMeta: {
            path: ["mpOrderId"],
            equals: mpId,
          },
        },
        select: { id: true, orderId: true, gatewayMeta: true },
      });
    }

    // Para notificações de payment, o payload pode trazer order_id; ele também
    // permite achar o registro mesmo que a notificação chegue antes do update local.
    const mpOrderId =
      (isOrderNotification ? mpId : payload.data?.order_id) ??
      getMetaOrderId(internalPayment?.gatewayMeta);

    if (!internalPayment && mpOrderId) {
      internalPayment = await prisma.payment.findFirst({
        where: {
          gatewayMeta: {
            path: ["mpOrderId"],
            equals: mpOrderId,
          },
        },
        select: { id: true, orderId: true, gatewayMeta: true },
      });
    }

    const resolvedOrderId =
      internalPayment?.orderId ?? payload.data?.external_reference ?? "";

    if (!resolvedOrderId) return NextResponse.json({ ok: true });

    const order = await prisma.order.findUnique({
      where: { id: resolvedOrderId },
      include: { payments: true, items: true },
    });

    if (!order) return NextResponse.json({ ok: true });

    // Orders API: consulta sempre /v1/orders/{ORD...}. Payment API antigo:
    // mantém compatibilidade somente quando a notificação não é de uma Order.
    const mpResult = mpOrderId
      ? await getMercadoPagoOrderStatus(mpOrderId)
      : isPaymentNotification
        ? await getMercadoPagoPayment(mpId)
        : null;

    if (!mpResult) return NextResponse.json({ ok: true });

    const normalizedStatus = mpResult.status.toLowerCase();
    const newOrderStatus = ORDER_STATUS_MAP[normalizedStatus];
    const newPaymentStatus = PAYMENT_STATUS_MAP[normalizedStatus];

    if (!newOrderStatus || !newPaymentStatus) {
      console.warn("[Webhook MP] Status não mapeado:", mpResult.status);
      return NextResponse.json({ ok: true });
    }

    const wasPaid = ["PAID", "SHIPPED", "COMPLETED"].includes(order.status);
    const shouldApplyPaidEffects = newOrderStatus === "PAID" && !wasPaid;
    const shouldRestorePaidEffects = wasPaid && ["CANCELED", "REFUNDED"].includes(newOrderStatus);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: newOrderStatus },
      });

      const payment = order.payments[0];
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            gatewayId: mpResult.paymentId ?? payment.gatewayId ?? mpId,
            status: newPaymentStatus,
            paidAt: newPaymentStatus === "APPROVED" ? new Date() : null,
          },
        });
      }

      // A notificação pode ser reenviada várias vezes. Só baixa o estoque na
      // transição para pago, evitando duplicidade.
      if (shouldApplyPaidEffects) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: StockMovementType.SALE_OUT,
              quantity: item.quantity,
              reason: `Venda online (pedido ${order.id.slice(-6)})`,
              referenceId: order.id,
            },
          });
        }

        const orderGifts = await tx.orderGift.findMany({
          where: { orderId: order.id },
        });
        for (const gift of orderGifts) {
          await tx.gift.updateMany({
            where: { id: gift.giftId, stockQuantity: { gt: 0 } },
            data: { stockQuantity: { decrement: gift.quantity } },
          });
        }

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

      // Se uma compra já paga for cancelada/reembolsada, restaura estoque e pontos
      // uma única vez. Estados já cancelados não entram nessa transição.
      if (shouldRestorePaidEffects) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: StockMovementType.RETURN_IN,
              quantity: item.quantity,
              reason: `Cancelamento via webhook Mercado Pago (pedido ${order.id.slice(-6)})`,
              referenceId: order.id,
            },
          });
        }

        const orderGifts = await tx.orderGift.findMany({
          where: { orderId: order.id },
        });
        for (const gift of orderGifts) {
          await tx.gift.update({
            where: { id: gift.giftId },
            data: { stockQuantity: { increment: gift.quantity } },
          });
        }

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

    revalidatePath("/admin/vendas");
    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/estoque");
    revalidatePath("/admin");
    revalidatePath("/perfil");

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Retornar 200 evita tempestade de retries quando o problema for interno;
    // o erro permanece registrado para diagnóstico no Vercel.
    console.error("[Webhook MP] Erro ao processar notificação:", error);
    return NextResponse.json({ ok: true });
  }
}
