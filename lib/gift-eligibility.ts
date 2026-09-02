import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// Brindes elegíveis para um pedido:
// - estão ativos e com estoque disponível;
// - o subtotal do pedido atingiu minPurchaseValue (quando definido);
// - respeitam o atrelamento do brinde a um produto ou categoria específica
//   (quando o brinde tem productId/categoryId, o pedido precisa conter
//   aquele produto ou um produto daquela categoria).
export async function findEligibleGifts(
  tx: Tx,
  { variantIds, subtotal }: { variantIds: string[]; subtotal: number }
) {
  if (variantIds.length === 0) return [];

  const variants = await tx.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      productId: true,
      product: { select: { categoryId: true } },
    },
  });
  const productIds = new Set(variants.map((v) => v.productId));
  const categoryIds = new Set(variants.map((v) => v.product.categoryId));

  const gifts = await tx.gift.findMany({
    where: {
      active: true,
      stockQuantity: { gt: 0 },
      OR: [
        { minPurchaseValue: null },
        { minPurchaseValue: { lte: subtotal } },
      ],
    },
    orderBy: { minPurchaseValue: "asc" },
  });

  return gifts.filter(
    (g) =>
      (!g.productId || productIds.has(g.productId)) &&
      (!g.categoryId || categoryIds.has(g.categoryId))
  );
}