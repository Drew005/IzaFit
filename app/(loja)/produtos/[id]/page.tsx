import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseProductDetails } from "@/lib/product-details";
import { getActiveDiscounts, computeVariantDiscount } from "@/lib/discounts";
import { getRecommendationsForProduct } from "@/lib/recommendations";
import ProductDetailView from "@/components/store/ProductDetailView";
import ProductRecommendations from "@/components/store/ProductRecommendations";

export const dynamic = "force-dynamic";

export default async function ProdutoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const [product, recommendations, activeDiscounts] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: {
          where: { active: true },
          orderBy: { sellPrice: "asc" },
        },
      },
    }),
    getRecommendationsForProduct(params.id, 4),
    getActiveDiscounts(),
  ]);

  if (!product || !product.active) {
    notFound();
  }

  // Descontos automáticos por variação.
  const discountById: Record<
    string,
    { originalPrice: number; finalPrice: number; discountId: string | null; discountName: string | null }
  > = {};
  for (const v of product.variants) {
    const original = Number(v.sellPrice);
    const result = computeVariantDiscount(
      original,
      { variantId: v.id, productId: product.id, categoryId: product.categoryId },
      activeDiscounts
    );
    if (result) {
      discountById[v.id] = {
        originalPrice: original,
        finalPrice: result.finalPrice,
        discountId: result.discountId,
        discountName: result.discountName,
      };
    }
  }

  const productImages = [product.imageUrl, ...(product.images ?? [])].filter(
    (url): url is string => Boolean(url)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Breadcrumb */}
      <Link
        href="/produtos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Voltar para a loja
      </Link>

      {/* Visualização de Detalhes com Cores, Variações e Galeria Interativa */}
      <ProductDetailView
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          brand: product.brand,
          category: product.category,
          imageUrl: product.imageUrl,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            color: v.color,
            colorHex: v.colorHex,
            size: v.size,
            imageUrl: v.imageUrl,
            sellPrice: Number(v.sellPrice),
            stockQuantity: v.stockQuantity,
          })),
        }}
        productImages={productImages}
        discountById={discountById}
      />

      {/* Características & Detalhes */}
      {product.details != null && parseProductDetails(product.details).length > 0 && (
        <section className="mt-12 rounded-md border border-base-line bg-base-raised p-6 md:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
            Características & Detalhes
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {parseProductDetails(product.details).map((section, i) => (
              <div key={i}>
                {section.title && (
                  <h3 className="text-sm font-medium uppercase tracking-wide text-volt">
                    {section.title}
                  </h3>
                )}
                <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="mt-0.5 text-volt">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sistema de Recomendação de Produtos */}
      {recommendations.length > 0 && (
        <div className="mt-16 border-t border-base-line pt-12">
          <ProductRecommendations
            products={recommendations}
            title="Quem viu este produto também comprou"
            subtitle="Itens selecionados que combinam com o seu estilo para completar o look"
            showViewAll
          />
        </div>
      )}
    </div>
  );
}
