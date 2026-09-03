import Link from "next/link";
import { Sparkles, ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveDiscounts, computeVariantDiscount } from "@/lib/discounts";
import ProductCard from "@/components/store/ProductCard";
import HeroCarousel from "@/components/store/HeroCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        variants: {
          select: { id: true, sellPrice: true, stockQuantity: true },
        },
        category: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Descontos automáticos para os cards em destaque.
  const activeDiscounts = await getActiveDiscounts();
  const discountByVariant = new Map<
    string,
    { originalPrice: number; finalPrice: number; discountName: string | null }
  >();
  for (const p of featured) {
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

  const featuredDiscounts = new Map(
    featured.map((p) => {
      const map: Record<
        string,
        { originalPrice: number; finalPrice: number; discountName: string | null }
      > = {};
      for (const v of p.variants) {
        const d = discountByVariant.get(v.id);
        if (d) map[v.id] = d;
      }
      return [p.id, map] as const;
    })
  );

  return (
    <div>
      {/* ============ HERO CAROUSEL ============ */}
      <HeroCarousel
        slides={[
          {
            image: "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
            alt: "IzaFit — Vista seu treino",
            href: "/produtos",
          },
          {
            image: "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
            alt: "IzaFit — Nova coleção",
            href: "/produtos?sort=new",
          },
        ]}
      />

      {/* ============ CATEGORIAS ============ */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Categorias
              </h2>
              <p className="text-sm text-ink-soft">Encontre o que combina com você</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/produtos?categoria=${c.slug}`}
                className="rounded-sm border border-base-line bg-base-raised px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-volt/60 hover:text-ink"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ NOVIDADES ============ */}
      <section id="novidades" className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Novidades
            </h2>
            <p className="text-sm text-ink-soft">Chegaram agora na loja</p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1 text-sm text-volt transition-colors hover:text-volt-dim"
          >
            Ver todos
            <ArrowRight size={15} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-base-line bg-base-raised p-8 text-center text-ink-soft">
            Nenhum produto publicado ainda. Cadastre produtos no painel
            administrativo para exibi-los aqui.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                discountById={featuredDiscounts.get(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="rounded-lg border border-volt/30 bg-gradient-to-br from-volt/10 to-transparent p-8 text-center md:p-12">
          <h3 className="font-display text-2xl font-semibold text-ink">
            Bora treinar com estilo?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Explore o catálogo completo e encontre as peças que vão acompanhar
            você no próximo desafio.
          </p>
          <Link
            href="/produtos"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-volt px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
          >
            Comprar agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
