"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { findEligibleGifts } from "@/lib/gift-eligibility";
import { CouponType, PaymentMethod } from "@prisma/client";

type CheckoutState = { error?: string; success?: string; orderId?: string } | null;

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

  revalidatePath("/perfil");
  return { success: "Pedido realizado com sucesso!", orderId: order.id };
}