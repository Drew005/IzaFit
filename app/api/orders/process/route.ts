// =============================================================================
// PROCESSAR ORDER (cartão de crédito) — Mercado Pago Orders API
// =============================================================================
// Endpoint chamado do front-end (Card Payment Brick) quando o cliente escolhe
// pagamento com cartão. Recebe o token do cartão gerado pelo Brick e o associa
// à order já criada pelo checkout, criando o pagamento real via Orders API.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { createMercadoPagoOrder } from "@/lib/mercadopago";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  // Autentica o cliente — só o dono do pedido pode processar o pagamento.
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: {
    orderId?: string;
    cardToken?: string;
    paymentMethodId?: string;
    paymentTypeId?: string;
    installments?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const {
    orderId,
    cardToken,
    paymentMethodId = "visa",
    paymentTypeId = "credit_card",
    installments = 1,
  } = body;

  if (!orderId || !cardToken) {
    return NextResponse.json(
      { error: "Faltam dados do cartão (orderId e token)." },
      { status: 400 }
    );
  }

  // Busca o pedido e garante que ele pertence ao cliente logado e está pendente.
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: customer.id, status: "PENDING" },
    include: { payments: true, items: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Pedido não encontrado ou já processado." },
      { status: 404 }
    );
  }

  const payment = order.payments[0];
  if (!payment) {
    return NextResponse.json(
      { error: "Nenhum pagamento associado ao pedido." },
      { status: 404 }
    );
  }

  let mpResult;
  try {
    mpResult = await createMercadoPagoOrder({
      amount: Math.round(Number(order.total) * 100),
      description: `IzaFit — Pedido #${order.id.slice(-6).toUpperCase()}`,
      orderId: order.id,
      cardToken,
      paymentMethodId,
      paymentTypeId,
      installments: Math.max(1, installments),
      payerEmail: customer.email || "",
      payerCpf: customer.cpf || undefined,
      payerName: customer.name || undefined,
      payerAddress: {
        zipCode: order.shippingZipCode ?? undefined,
        street: order.shippingStreet ?? undefined,
        number: order.shippingNumber ?? undefined,
        complement: order.shippingComplement ?? undefined,
        district: order.shippingDistrict ?? undefined,
        city: order.shippingCity ?? undefined,
        state: order.shippingState ?? undefined,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido ao processar pagamento.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Status da order do MP → status interno.
  // "processed"/"approved" → APPROVED/PAID; senão mantém PENDING.
  const approved = ["processed", "approved", "accredited", "authorized"].includes(
    mpResult.status.toLowerCase()
  );

  const newPaymentStatus: PaymentStatus = approved ? "APPROVED" : "PENDING";
  const newOrderStatus: "PAID" | "PENDING" = approved ? "PAID" : "PENDING";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        gatewayId: mpResult.gatewayId,
        gatewayMeta: {
          statusDetail: mpResult.statusDetail ?? null,
          mpOrderId: mpResult.mpOrderId,
          card: {
            paymentMethodId,
            installments: Math.max(1, installments),
          },
        },
        installments: Math.max(1, installments),
        status: newPaymentStatus,
        paidAt: approved ? new Date() : null,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: newOrderStatus },
    });

    // Se aprovado de imediato (processamento automático), baixa o estoque
    // e aplica pontos de fidelidade — igual ao webhook faz para PIX/boleto.
    if (approved) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
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
  });

  // Invalida caches para refletir a mudança de status (igual ao webhook).
  revalidatePath("/admin/vendas");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  revalidatePath("/perfil");

  return NextResponse.json({
    ok: true,
    status: newPaymentStatus,
    message: approved
      ? "Pagamento aprovado!"
      : "Pagamento em análise, aguardando confirmação.",
  });
}
