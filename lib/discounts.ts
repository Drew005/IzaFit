import { prisma } from "@/lib/prisma";
import { CouponType } from "@prisma/client";

// =============================================================================
// DESCONTOS AUTOMÁTICOS
// =============================================================================
// Um desconto pode estar vinculado a um dos três níveis:
//   - variantId  → aplica apenas àquela variação
//   - productId  → aplica a todas as variações do produto
//   - categoryId → aplica a todas as variações dos produtos da categoria
//
// Quando vários descontos ativos atingem a mesma variação, o cliente recebe o
// melhor resultado (o menor preço final).
// =============================================================================

export type DiscountLike = {
  id: string;
  name: string;
  type: CouponType;
  value: { toString(): string } | number;
  productId: string | null;
  categoryId: string | null;
  variantId: string | null;
  active: boolean;
  validUntil: Date | null;
};

export type DiscountedVariant = {
  variantId: string;
  originalPrice: number;
  finalPrice: number;
  discountName: string | null;
  discountId: string | null;
};

// Busca todos os descontos ativos e não expirados.
export async function getActiveDiscounts(): Promise<DiscountLike[]> {
  const now = new Date();
  return prisma.discount.findMany({
    where: {
      active: true,
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    },
  });
}

// Calcula o desconto (em reais) e o preço final para uma variação, dado o
// conjunto de descontos ativos e o contexto (productId + categoryId da
// variação). Retorna null se nenhum desconto se aplica.
export function computeVariantDiscount(
  originalPrice: number,
  context: { variantId: string; productId: string; categoryId: string | null },
  discounts: DiscountLike[]
): { discountInReais: number; finalPrice: number; discountId: string | null; discountName: string | null } | null {
  // Descontos que se aplicam a esta variação (um por nível, o melhor deles).
  const directVariant = discounts.filter((d) => d.variantId === context.variantId);
  const byProduct = discounts.filter((d) => d.productId === context.productId && !d.variantId);
  const byCategory = discounts.filter(
    (d) => d.categoryId && d.categoryId === context.categoryId && !d.productId && !d.variantId
  );

  const all = [...directVariant, ...byProduct, ...byCategory];
  if (all.length === 0) return null;

  let best: DiscountLike | null = null;
  let bestFinal = originalPrice;

  for (const d of all) {
    const value = Number(d.value);
    let final = originalPrice;
    if (d.type === CouponType.PERCENTAGE) {
      final = originalPrice * (1 - value / 100);
    } else {
      // Desconto fixo, limitado ao valor do item (não pode ficar negativo).
      final = Math.max(0, originalPrice - value);
    }
    if (final < bestFinal) {
      bestFinal = final;
      best = d;
    }
  }

  if (!best || bestFinal >= originalPrice) return null;
  return {
    discountInReais: originalPrice - bestFinal,
    finalPrice: bestFinal,
    discountId: best.id,
    discountName: best.name,
  };
}

// Faz o mapeamento de descontos para uma lista de variações, consultando o
// banco para obter o contexto (productId/categoryId) das variações não
// informadas. Economiza chamadas ao banco reutilizando a query de descontos.
export async function applyDiscountsToVariants(
  variantIds: string[]
): Promise<{ finalPrice: number; discountId: string | null }[]> {
  const discounts = await getActiveDiscounts();
  if (discounts.length === 0) {
    return variantIds.map(() => ({ finalPrice: 0, discountId: null }));
  }

  // Resolve o contexto de cada variação.
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { id: true, categoryId: true } } },
  });

  const byId = new Map(variants.map((v) => [v.id, v]));

  return variantIds.map((id) => {
    const v = byId.get(id);
    if (!v) return { finalPrice: 0, discountId: null };
    const original = Number(v.sellPrice);
    const result = computeVariantDiscount(original, {
      variantId: v.id,
      productId: v.product.id,
      categoryId: v.product.categoryId,
    }, discounts);
    if (!result) return { finalPrice: original, discountId: null };
    return { finalPrice: result.finalPrice, discountId: result.discountId };
  });
}
