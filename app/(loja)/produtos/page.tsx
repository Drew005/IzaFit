import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; q?: string; sort?: string };
}) {
  const categoriaSlug = searchParams.categoria;
  const q = searchParams.q?.trim();
  const sort =
    searchParams.sort === "best" || searchParams.sort === "new"
      ? searchParams.sort
      : null;

  const [categories, products, bestSellerTotals] = await Promise.all([
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
        variants: { select: { id: true, sellPrice: true, stockQuantity: true } },
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
  ]);

  const soldByVariant = new Map(
    bestSellerTotals.map((item) => [item.variantId, item._sum.quantity ?? 0])
  );
  const sortedProducts =
    sort === "best"
      ? [...products].sort((a, b) => {
          const soldA = a.variants.reduce(
            (total, variant) => total + (soldByVariant.get(variant.id) ?? 0),
            0
          );
          const soldB = b.variants.reduce(
            (total, variant) => total + (soldByVariant.get(variant.id) ?? 0),
            0
          );
          return soldB - soldA;
        })
      : products;

  const activeCat = categories.find((c) => c.slug === categoriaSlug);

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
                  : sort === "new"
                    ? "Novidades"
                    : "Todos os produtos"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {sortedProducts.length} {sortedProducts.length === 1 ? "produto" : "produtos"}
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
                    href="/produtos"
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
                          ? `/produtos${sort ? `?sort=${sort}` : ""}`
                          : `/produtos?categoria=${c.slug}${sort ? `&sort=${sort}` : ""}`
                      }
                      className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                        categoriaSlug === c.slug
                          ? "bg-base text-ink font-medium"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {c.name}
                      <span className="text-xs text-ink-soft/60">{c._count.products}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Grade de produtos */}
        <div>
          {sortedProducts.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
