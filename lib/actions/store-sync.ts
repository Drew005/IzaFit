"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

export async function getCart() {
  const customer = await getCurrentCustomer();
  if (!customer) return [];

  return await prisma.cartItem.findMany({
    where: { customerId: customer.id },
    include: { variant: { include: { product: true } } },
  });
}

export async function saveCartItem(variantId: string, quantity: number) {
  const customer = await getCurrentCustomer();
  if (!customer) return;

  await prisma.cartItem.upsert({
    where: {
      customerId_variantId: {
        customerId: customer.id,
        variantId,
      },
    },
    update: { quantity },
    create: {
      customerId: customer.id,
      variantId,
      quantity,
    },
  });
}

export async function removeCartItem(variantId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return;

  await prisma.cartItem.deleteMany({
    where: {
      customerId: customer.id,
      variantId,
    },
  });
}

export async function getFavorites() {
  const customer = await getCurrentCustomer();
  if (!customer) return [];

  return await prisma.favorite.findMany({
    where: { customerId: customer.id },
    include: { product: { include: { variants: true } } },
  });
}

export async function toggleFavorite(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return;

  const existing = await prisma.favorite.findUnique({
    where: {
      customerId_productId: {
        customerId: customer.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: {
        customerId: customer.id,
        productId,
      },
    });
  }
}
