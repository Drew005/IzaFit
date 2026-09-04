"use server";

import { prisma } from "@/lib/prisma";
import { CouponType } from "@prisma/client";

export async function validateCoupon(code: string, subtotal: number) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return { error: "Informe um cupom." };
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { error: "Subtotal inválido." };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  const now = new Date();
  const valid =
    coupon &&
    coupon.active &&
    (!coupon.validFrom || coupon.validFrom <= now) &&
    (!coupon.validUntil || coupon.validUntil >= now) &&
    (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
    (coupon.minPurchase === null || Number(coupon.minPurchase) <= subtotal);

  if (!valid) {
    return { error: "Cupom inválido, expirado ou não aplicável a este valor." };
  }

  const discount =
    coupon.type === CouponType.PERCENTAGE
      ? Math.min(subtotal, subtotal * (Number(coupon.value) / 100))
      : Math.min(Number(coupon.value), subtotal);

  return {
    code: normalizedCode,
    discount,
    newTotal: Math.max(0, subtotal - discount),
    message: `Cupom aplicado! Você economiza ${discount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}.`,
  };
}
