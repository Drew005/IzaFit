"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { findEligibleGifts } from "@/lib/gift-eligibility";
import { createMercadoPagoPayment, isCardPaymentConfigured, type CheckoutPaymentResult } from "@/lib/mercadopago";
import { CouponType, PaymentMethod } from "@prisma/client";

/**
 * Estado retornado pelo checkout. Pode conter dados de pagamento
 * para exibir ao cliente (PIX copia-e-cola, QR Code, link boleto).
 */
type CheckoutState = {
  error?: string;
  success?: string;
  orderId?: string;
  payment?: CheckoutPaymentResult;
  /** true quando o pagamento é por cartão e precisa ser processado no front-end */
  requiresCardProcessing?: boolean;
  /** total do pedido em centavos (usado pelo Brick quando o carrinho já foi limpo) */
  orderTotal?: number;
} | null;

export async function checkout(
  _prevState: CheckoutState | undefined,
  formData: FormData
): Promise<CheckoutState> {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Faça login para finalizar a compra." };

  const variantIds = formData.getAll("variantId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const addressId = (formData.get("addressId") as string)?.trim() || null;
  const couponCode = (formData.get("couponCode") as string)?.trim().toUpperCase() || null;
  const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.PIX;
  const recipient = (formData.get("recipient") as string)?.trim() || customer.name || "";

  if (variantIds.length === 0) return { error: "Seu carrinho está vazio." };

  // O endereço precisa pertencer ao cliente logado.
  const address = addressId
    ? await prisma.address.findFirst({
        where: { id: addressId, customerId: customer.id },
      })
    : null;
  if (!address) return { error: "Selecione um endereço de entrega." };

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const itemsData: {
      variantId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    // Preços e estoque sempre relidos do banco — nunca confiar nos valores
    // enviados pelo cliente.
    for (let i = 0; i < variantIds.length; i++) {
      const qty = parseInt(quantities[i] || "1", 10);
      if (!Number.isFinite(qty) || qty < 1) {
        throw new Error("Quantidade inválida no carrinho.");
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: variantIds[i] },
        include: { product: true },
      });
      if (!variant || !variant.active || !variant.product.active) {
        throw new Error("Um dos produtos do carrinho não está mais disponível.");
      }
      if (variant.stockQuantity < qty) {
        throw new Error(`Estoque insuficiente para "${variant.product.name}".`);
      }

      const lineSubtotal = qty * Number(variant.sellPrice);
      subtotal += lineSubtotal;
      itemsData.push({
        variantId: variant.id,
        quantity: qty,
        unitPrice: Number(variant.sellPrice),
        subtotal: lineSubtotal,
      });
    }

    // Cupom: só aplica se ativo, dentro da validade, dentro do limite de usos
    // e com subtotal mínimo atingido (quando configurado).
    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
      const now = new Date();
      const valid =
        coupon &&
        coupon.active &&
        (!coupon.validFrom || coupon.validFrom <= now) &&
        (!coupon.validUntil || coupon.validUntil >= now) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        (coupon.minPurchase === null || Number(coupon.minPurchase) <= subtotal);
      if (valid && coupon) {
        couponId = coupon.id;
        discount =
          coupon.type === CouponType.PERCENTAGE
            ? subtotal * (Number(coupon.value) / 100)
            : Math.min(Number(coupon.value), subtotal);
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const total = Math.max(0, subtotal - discount);

    const created = await tx.order.create({
      data: {
        customerId: customer.id,
        couponId,
        status: "PENDING",
        subtotal,
        discount,
        total,
        // Snapshot do endereço de entrega no momento do pedido.
        addressId: address.id,
        shippingRecipient: recipient,
        shippingStreet: address.street,
        shippingNumber: address.number,
        shippingComplement: address.complement,
        shippingDistrict: address.district,
        shippingCity: address.city,
        shippingState: address.state,
        shippingZipCode: address.zipCode,
        items: { create: itemsData },
        payments: {
          create: {
            method: paymentMethod,
            amount: total,
            installments: 1,
            status: "PENDING",
          },
        },
      },
    });

    // Brindes elegíveis automaticamente (subtotal + produto/categoria).
    // Estoque só é debitado quando o pedido for pago (ver updateOrderStatus).
    const eligibleGifts = await findEligibleGifts(tx, {
      variantIds,
      subtotal,
    });
    for (const gift of eligibleGifts) {
      await tx.orderGift.create({
        data: { orderId: created.id, giftId: gift.id },
      });
    }

    return created;
  });

  // ── Criar pagamento no Mercado Pago ──
  // O checkout transparente só aceita PIX, cartão de crédito ou boleto.
  // Qualquer outro método cai em PIX como fallback seguro.
  const mpMethod =
    paymentMethod === PaymentMethod.CREDIT_CARD
      ? "CREDIT_CARD"
      : paymentMethod === PaymentMethod.BOLETO
        ? "BOLETO"
        : "PIX";

  // CARTAO: o pagamento real é processado no front-end (Card Payment Brick)
  // via /api/orders/process, porque o token do cartão só existe lá. Aqui
  // apenas criamos o pedido e o pagamento como PENDING e devolvemos o orderId
  // para o CheckoutForm renderizar o Brick.
  if (mpMethod === "CREDIT_CARD") {
    if (!isCardPaymentConfigured()) {
      return { error: "Pagamento por cartão não configurado. Configure ACCESS_TOKEN e PUBLIC_KEY." };
    }
    revalidatePath("/perfil");
    return {
      success: "Pedido criado. Finalize o cartão para confirmar.",
      orderId: order.id,
      requiresCardProcessing: true,
      orderTotal: Math.round(Number(order.total) * 100),
    };
  }

  let payResult;
  try {
    // Boleto exige nome completo e CPF do cliente na Orders API — falha cedo
    // com mensagem amigável (o catch abaixo cancela o pedido e informa o cliente).
    if (mpMethod === "BOLETO" && (!customer.name?.trim() || !customer.cpf)) {
      throw new Error(
        "Para pagar com boleto, preencha seu nome completo e CPF em /perfil."
      );
    }

    payResult = await createMercadoPagoPayment({
      amount: Math.round(Number(order.total) * 100),
      description: `IzaFit — Pedido #${order.id.slice(-6).toUpperCase()}`,
      method: mpMethod,
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
      orderId: order.id,
      installments: 1,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido ao gerar pagamento.";
    console.error("[Checkout] Erro ao gerar pagamento:", msg);
    // Cancela o pedido para não ficar como PENDING órfão.
    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { gatewayMeta: { error: msg }, status: "DENIED" },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELED" },
      });
    });
    return { error: msg };
  }

  // Grava o ID externo do gateway no pagamento para casar com o webhook.
  await prisma.payment.updateMany({
    where: { orderId: order.id },
    data: {
      gatewayId: payResult.externalPaymentId,
      gatewayMeta: {
        pixCode: payResult.pixCode ?? null,
        pixQrCodeBase64: payResult.pixQrCodeBase64 ?? null,
        boletoUrl: payResult.boletoUrl ?? null,
        mpOrderId: payResult.mpOrderId,
      },
    },
  });

  revalidatePath("/perfil");
  return {
    success: "Pedido realizado com sucesso!",
    orderId: order.id,
    payment: payResult,
  };
}