import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/format";
import { parseProductDetails } from "@/lib/product-details";
import { getActiveDiscounts, computeVariantDiscount } from "@/lib/discounts";
import ProductGallery from "@/components/store/ProductGallery";
import BuyBox from "@/components/store/BuyBox";

export const dynamic = "force-dynamic";

export default async function ProdutoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      variants: {
        where: { active: true },
        orderBy: { sellPrice: "asc" },
      },
    },
  });

  if (!product || !product.active) {
    notFound();
  }

  const inStockVariants = product.variants.filter((v) => v.stockQuantity > 0);
  const hasStock = inStockVariants.length > 0;

  // Descontos automáticos por variação.
  const activeDiscounts = await getActiveDiscounts();
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

  const minPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.sellPrice)))
      : null;
  const minDiscounted =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => (discountById[v.id]?.finalPrice ?? Number(v.sellPrice))))
      : null;
  const maxPrice =
    product.variants.length > 0
      ? Math.max(...product.variants.map((v) => Number(v.sellPrice)))
      : null;
  const totalStock = product.variants.reduce(
    (acc, v) => acc + v.stockQuantity,
    0
  );

  const productImages = [product.imageUrl, ...(product.images ?? [])].filter(
    (url): url is string => Boolean(url)
  );

  const priceLabel =
    minDiscounted !== null && minDiscounted !== null
      ? (() => {
          const hasDiscount = minDiscounted !== null && minDiscounted < (minPrice ?? 0);
          return hasDiscount
            ? `${currency(minDiscounted)}`
            : minPrice !== null && maxPrice !== null && maxPrice > minPrice
              ? `${currency(minPrice)} – ${currency(maxPrice)}`
              : minPrice !== null
                ? currency(minPrice)
                : null;
        })()
      : null;

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

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Imagem do produto */}
        <ProductGallery
          images={productImages}
          name={product.name}
          esgotado={!hasStock}
        />

        {/* Informações */}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            {product.category?.name ?? "Produto"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {product.name}
          </h1>

          {product.brand && (
            <p className="mt-1 text-sm text-ink-soft">Marca: {product.brand}</p>
          )}

          <p className="mt-4 text-lg text-ink-soft md:text-xl">
            {product.description || "Veja o produto na loja física ou fale conosco para mais detalhes."}
          </p>

          <div className="mt-6 rounded-md border border-base-line bg-base-raised p-5">
            {priceLabel ? (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {minPrice !== null && minDiscounted !== null && minDiscounted < minPrice && (
                    <span className="line-through text-ink-soft">
                      {currency(minPrice)}
                    </span>
                  )}
                  <p className="font-display text-3xl text-volt">{priceLabel}</p>
                </div>
                {minPrice !== null && minDiscounted !== null && minDiscounted < minPrice && (
                  <p className="mt-1 text-sm text-volt">
                    {Math.round((1 - minDiscounted / minPrice) * 100)}% off com promoção automática
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-ink-soft">Consultar disponibilidade</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm">
              {hasStock ? (
                <>
                  <Check size={15} className="text-volt" />
                  <span className="text-ink">
                    Em estoque {totalStock > 0 && `· ${totalStock} un.`}
                  </span>
                </>
              ) : (
                <span className="text-alert">Produto esgotado</span>
              )}
            </div>
          </div>

          {/* Compra: seleção de variação, favoritar e carrinho */}
          <BuyBox
            productId={product.id}
            productName={product.name}
            imageUrl={productImages[0] ?? null}
            variants={product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              sellPrice: Number(v.sellPrice),
              stockQuantity: v.stockQuantity,
            }))}
            discountById={discountById}
          />

          {/* Garantias */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-base-line pt-6 text-center">
            <div>
              <Truck size={18} className="mx-auto text-volt" />
              <p className="mt-1.5 text-xs text-ink-soft">Entrega p/ Morro de São Paulo e Valença - BA</p>
            </div>
            <div>
              <ShieldCheck size={18} className="mx-auto text-volt" />
              <p className="mt-1.5 text-xs text-ink-soft">Compra segura</p>
            </div>
            <div>
              <RotateCcw size={18} className="mx-auto text-volt" />
              <p className="mt-1.5 text-xs text-ink-soft">Trocas fáceis</p>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
