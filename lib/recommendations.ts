import { prisma } from "@/lib/prisma";
import { getActiveDiscounts, computeVariantDiscount } from "@/lib/discounts";

export type RecommendedProduct = {
  id: string;
  name: string;
  imageUrl?: string | null;
  images?: string[] | null;
  category?: { name: string; slug?: string } | null;
  variants: {
    id: string;
    sellPrice: number | { toString(): string };
    stockQuantity: number;
    color?: string | null;
    colorHex?: string | null;
    size?: string | null;
    imageUrl?: string | null;
  }[];
  recommendationReason?:
    | "bought_together"
    | "same_category"
    | "top_seller"
    | "special_offer"
    | "trending";
  discountById?: Record<
    string,
    { originalPrice: number; finalPrice: number; discountName: string | null }
  >;
};

/**
 * Calcula o mapa de descontos para um array de produtos
 */
async function attachDiscountsToProducts<
  T extends {
    id: string;
    categoryId: string | null;
    variants: { id: string; sellPrice: any; stockQuantity: number }[];
  },
>(products: T[]) {
  const activeDiscounts = await getActiveDiscounts();

  return products.map((p) => {
    const discountById: Record<
      string,
      { originalPrice: number; finalPrice: number; discountName: string | null }
    > = {};

    for (const v of p.variants) {
      const original = Number(v.sellPrice);
      const result = computeVariantDiscount(
        original,
        { variantId: v.id, productId: p.id, categoryId: p.categoryId },
        activeDiscounts
      );
      if (result) {
        discountById[v.id] = {
          originalPrice: original,
          finalPrice: result.finalPrice,
          discountName: result.discountName,
        };
      }
    }

    return {
      ...p,
      discountById,
    };
  });
}

/**
 * Recomendações para a página de detalhe de um produto (/produtos/[id]):
 * 1. Produtos comprados juntos em pedidos anteriores (Collaborative Filtering)
 * 2. Produtos da mesma categoria (Content-based)
 * 3. Produtos mais vendidos / novidades (Fallback)
 */
export async function getRecommendationsForProduct(
  productId: string,
  limit = 4
): Promise<RecommendedProduct[]> {
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true, brand: true },
  });

  if (!current) return [];

  const foundProductIds = new Set<string>();
  const results: { product: any; reason: RecommendedProduct["recommendationReason"] }[] = [];

  // 1. Produtos comprados juntos (Pedidos pagos/concluídos que incluem o productId)
  const coOrders = await prisma.orderItem.findMany({
    where: {
      variant: { productId },
      order: {
        status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
      },
    },
    select: { orderId: true },
    take: 30,
  });

  if (coOrders.length > 0) {
    const orderIds = coOrders.map((o) => o.orderId);

    const coItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        variant: {
          productId: { not: productId },
          product: { active: true },
        },
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: { select: { name: true, slug: true } },
                variants: {
                  where: { active: true },
                  select: {
                    id: true,
                    sellPrice: true,
                    stockQuantity: true,
                    color: true,
                    colorHex: true,
                    size: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Contar frequência de cada produto comprado junto
    const freqMap = new Map<string, { product: any; count: number }>();
    for (const item of coItems) {
      const p = item.variant.product;
      if (!p || !p.active || p.variants.length === 0) continue;
      const currentCount = freqMap.get(p.id)?.count ?? 0;
      freqMap.set(p.id, { product: p, count: currentCount + 1 });
    }

    const sortedCoProducts = Array.from(freqMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    for (const item of sortedCoProducts) {
      if (!foundProductIds.has(item.product.id) && results.length < limit) {
        foundProductIds.add(item.product.id);
        results.push({ product: item.product, reason: "bought_together" });
      }
    }
  }

  // 2. Mesma categoria (se ainda precisar preencher até o limite)
  if (results.length < limit && current.categoryId) {
    const sameCategory = await prisma.product.findMany({
      where: {
        active: true,
        categoryId: current.categoryId,
        id: { notIn: [productId, ...Array.from(foundProductIds)] },
      },
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { active: true },
          select: {
            id: true,
            sellPrice: true,
            stockQuantity: true,
            color: true,
            colorHex: true,
            size: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit - results.length,
    });

    for (const p of sameCategory) {
      if (p.variants.length > 0 && !foundProductIds.has(p.id) && results.length < limit) {
        foundProductIds.add(p.id);
        results.push({ product: p, reason: "same_category" });
      }
    }
  }

  // 3. Fallback: Produtos mais vendidos ou destaques gerais
  if (results.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        active: true,
        id: { notIn: [productId, ...Array.from(foundProductIds)] },
      },
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { active: true },
          select: {
            id: true,
            sellPrice: true,
            stockQuantity: true,
            color: true,
            colorHex: true,
            size: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit - results.length,
    });

    for (const p of fallbackProducts) {
      if (p.variants.length > 0 && !foundProductIds.has(p.id) && results.length < limit) {
        foundProductIds.add(p.id);
        results.push({ product: p, reason: "trending" });
      }
    }
  }

  // Anexa descontos aos produtos recomendados
  const formattedProducts = await attachDiscountsToProducts(
    results.map((r) => r.product)
  );

  return formattedProducts.map((p, index) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    images: p.images,
    category: p.category,
    variants: p.variants,
    recommendationReason: results[index]?.reason,
    discountById: p.discountById,
  }));
}

/**
 * Recomendações gerais para a vitrine e catálogo (/produtos):
 * Retorna produtos em destaque por promoção, mais vendidos e novidades selecionadas.
 */
export async function getCatalogRecommendations(
  limit = 4,
  excludeIds: string[] = []
): Promise<RecommendedProduct[]> {
  // 1. Busca produtos mais vendidos
  const bestSellerTotals = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: {
      order: {
        status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
      },
    },
    _sum: { quantity: true },
  });

  const soldByVariant = new Map(
    bestSellerTotals.map((item) => [item.variantId, item._sum.quantity ?? 0])
  );

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: {
        where: { active: true },
        select: {
          id: true,
          sellPrice: true,
          stockQuantity: true,
          color: true,
          colorHex: true,
          size: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (products.length === 0) return [];

  const productsWithDiscounts = await attachDiscountsToProducts(products);

  // Classifica e ranqueia produtos
  const scoredProducts = productsWithDiscounts.map((p) => {
    const totalSold = p.variants.reduce(
      (acc, v) => acc + (soldByVariant.get(v.id) ?? 0),
      0
    );
    const hasDiscount = Object.keys(p.discountById).length > 0;
    const inStock = p.variants.some((v) => v.stockQuantity > 0);

    let reason: RecommendedProduct["recommendationReason"] = "trending";
    let score = 0;

    if (totalSold > 0) {
      score += totalSold * 10;
      reason = "top_seller";
    }
    if (hasDiscount) {
      score += 15;
      if (reason !== "top_seller") reason = "special_offer";
    }
    if (inStock) {
      score += 5;
    }

    return {
      product: p,
      score,
      reason,
    };
  });

  // Ordena por score e pega o limite solicitado
  scoredProducts.sort((a, b) => b.score - a.score);
  const topRecommendations = scoredProducts.slice(0, limit);

  return topRecommendations.map(({ product, reason }) => ({
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    images: product.images,
    category: product.category,
    variants: product.variants,
    recommendationReason: reason,
    discountById: product.discountById,
  }));
}
