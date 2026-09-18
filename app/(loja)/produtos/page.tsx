import Link from "next/link";
import { SlidersHorizontal, Sparkles, TrendingUp, Flame, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveDiscounts, computeVariantDiscount } from "@/lib/discounts";
import { getCatalogRecommendations } from "@/lib/recommendations";
import ProductCard from "@/components/store/ProductCard";
import ProductRecommendations from "@/components/store/ProductRecommendations";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; q?: string; sort?: string };
}) {
  const categoriaSlug = searchParams.categoria;
  const q = searchParams.q?.trim();
  const sort = searchParams.sort || "recommended";

  const [categories, products, bestSellerTotals, catalogRecommendations] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.findMany({
        where: {
          active: true,
          ...(categoriaSlug ? { category: { slug: categoriaSlug } } : {}),
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
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
          category: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        where: {
          order: {
            status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
          },
        },
        _sum: { quantity: true },
      }),
      getCatalogRecommendations(4),
    ]);

  // Descontos automáticos: mapa variantId -> { originalPrice, finalPrice }.
  const activeDiscounts = await getActiveDiscounts();
  const discountByVariant = new Map<
    string,
    { originalPrice: number; finalPrice: number; discountName: string | null }
  >();
  for (const p of products) {
    for (const v of p.variants) {
      const original = Number(v.sellPrice);
      const result = computeVariantDiscount(
        original,
        { variantId: v.id, productId: p.id, categoryId: p.categoryId },
        activeDiscounts
      );
      if (result) {
        discountByVariant.set(v.id, {
          originalPrice: original,
          finalPrice: result.finalPrice,
          discountName: result.discountName,
        });
      }
    }
  }

  const soldByVariant = new Map(
    bestSellerTotals.map((item) => [item.variantId, item._sum.quantity ?? 0])
  );

  // Ordenação inteligente com base em recomendação
  const sortedProducts = (() => {
    const list = [...products];

    if (sort === "best") {
      return list.sort((a, b) => {
        const soldA = a.variants.reduce(
          (total, variant) => total + (soldByVariant.get(variant.id) ?? 0),
          0
        );
        const soldB = b.variants.reduce(
          (total, variant) => total + (soldByVariant.get(variant.id) ?? 0),
          0
        );
        return soldB - soldA;
      });
    }

    if (sort === "offers") {
      return list.sort((a, b) => {
        const discountA = a.variants.some((v) => discountByVariant.has(v.id))
          ? 1
          : 0;
        const discountB = b.variants.some((v) => discountByVariant.has(v.id))
          ? 1
          : 0;
        return discountB - discountA;
      });
    }

    if (sort === "new") {
      return list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Default: "recommended" (ponderação inteligente de vendas + descontos + estoque)
    return list.sort((a, b) => {
      const soldA = a.variants.reduce(
        (tot, v) => tot + (soldByVariant.get(v.id) ?? 0),
        0
      );
      const soldB = b.variants.reduce(
        (tot, v) => tot + (soldByVariant.get(v.id) ?? 0),
        0
      );
      const discountA = a.variants.some((v) => discountByVariant.has(v.id))
        ? 15
        : 0;
      const discountB = b.variants.some((v) => discountByVariant.has(v.id))
        ? 15
        : 0;
      const stockA = a.variants.some((v) => v.stockQuantity > 0) ? 5 : 0;
      const stockB = b.variants.some((v) => v.stockQuantity > 0) ? 5 : 0;
      const scoreA = soldA * 10 + discountA + stockA;
      const scoreB = soldB * 10 + discountB + stockB;
      return scoreB - scoreA;
    });
  })();

  const activeCat = categories.find((c) => c.slug === categoriaSlug);

  function buildFilterUrl(newSort: string) {
    const params = new URLSearchParams();
    if (categoriaSlug) params.set("categoria", categoriaSlug);
    if (q) params.set("q", q);
    if (newSort !== "recommended") params.set("sort", newSort);
    const queryString = params.toString();
    return queryString ? `/produtos?${queryString}` : "/produtos";
  }

  return (
    <div>
      {/* Cabeçalho */}
      <section className="border-b border-base-line bg-base-raised">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <SlidersHorizontal size={14} className="text-volt" />
            Catálogo completo
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {q
              ? `Resultados para "${q}"`
              : activeCat
                ? activeCat.name
                : sort === "best"
                  ? "Mais vendidos"
                  : sort === "offers"
                    ? "Promoções & Ofertas"
                    : sort === "new"
                      ? "Novidades"
                      : "Recomendados para você"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {sortedProducts.length}{" "}
            {sortedProducts.length === 1 ? "produto" : "produtos"}
            {activeCat ? ` em ${activeCat.name}` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
        {/* Filtros laterais */}
        <aside>
          <div className="sticky top-20">
            <div className="rounded-md border border-base-line bg-base-raised p-4">
              <p className="text-sm font-medium text-ink">Categorias</p>
              <ul className="mt-3 space-y-1">
                <li>
                  <Link
                    href={buildFilterUrl(sort).replace(/&?categoria=[^&]*/, "") || "/produtos"}
                    className={`block rounded-sm px-3 py-2 text-sm transition-colors ${
                      !categoriaSlug
                        ? "bg-base text-ink font-medium"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Todas
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={
                        categoriaSlug === c.slug
                          ? `/produtos${sort !== "recommended" ? `?sort=${sort}` : ""}`
                          : `/produtos?categoria=${c.slug}${sort !== "recommended" ? `&sort=${sort}` : ""}`
                      }
                      className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                        categoriaSlug === c.slug
                          ? "bg-base text-ink font-medium"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {c.name}
                      <span className="text-xs text-ink-soft/60">
                        {c._count.products}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Grade de produtos com barra de recomendações */}
        <div className="space-y-6">
          {/* Abas e Ordenação por Recomendação */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-line pb-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-ink-soft mr-1">Ordenar por:</span>
              <Link
                href={buildFilterUrl("recommended")}
                className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 transition-colors ${
                  sort === "recommended"
                    ? "bg-volt text-base font-medium"
                    : "bg-base-raised text-ink-soft hover:text-ink border border-base-line"
                }`}
              >
                <Sparkles size={13} />
                Recomendados
              </Link>
              <Link
                href={buildFilterUrl("best")}
                className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 transition-colors ${
                  sort === "best"
                    ? "bg-volt text-base font-medium"
                    : "bg-base-raised text-ink-soft hover:text-ink border border-base-line"
                }`}
              >
                <TrendingUp size={13} />
                Mais vendidos
              </Link>
              <Link
                href={buildFilterUrl("offers")}
                className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 transition-colors ${
                  sort === "offers"
                    ? "bg-volt text-base font-medium"
                    : "bg-base-raised text-ink-soft hover:text-ink border border-base-line"
                }`}
              >
                <Flame size={13} />
                Ofertas
              </Link>
              <Link
                href={buildFilterUrl("new")}
                className={`flex items-center gap-1 rounded-sm px-2.5 py-1.5 transition-colors ${
                  sort === "new"
                    ? "bg-volt text-base font-medium"
                    : "bg-base-raised text-ink-soft hover:text-ink border border-base-line"
                }`}
              >
                <Clock size={13} />
                Novidades
              </Link>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="space-y-10">
              <div className="rounded-md border border-dashed border-base-line bg-base-raised p-10 text-center">
                <p className="text-ink-soft">
                  Nenhum produto encontrado para esta seleção.
                </p>
                <Link
                  href="/produtos"
                  className="mt-4 inline-block text-sm text-volt hover:text-volt-dim"
                >
                  Limpar filtros
                </Link>
              </div>

              {/* Sugestões recomendadas caso a busca seja vazia */}
              {catalogRecommendations.length > 0 && (
                <div className="pt-4">
                  <ProductRecommendations
                    products={catalogRecommendations}
                    title="Você também pode gostar"
                    subtitle="Confira alguns dos produtos mais procurados na IzaFit"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {sortedProducts.map((p) => {
                const pDiscounts: Record<
                  string,
                  { originalPrice: number; finalPrice: number; discountName: string | null }
                > = {};
                for (const v of p.variants) {
                  const d = discountByVariant.get(v.id);
                  if (d) pDiscounts[v.id] = d;
                }
                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    discountById={pDiscounts}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
