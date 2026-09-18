"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { currency } from "@/lib/format";
import { Shirt } from "lucide-react";
import FavoriteButton from "@/components/store/FavoriteButton";

// Tipo mínimo esperado de um produto no card da loja.
export type StoreVariant = {
  id?: string;
  sku?: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  sellPrice: number | { toString(): string };
  stockQuantity: number;
};

export type StoreProduct = {
  id: string;
  name: string;
  imageUrl?: string | null;
  images?: string[] | null;
  category?: { name: string } | null;
  variants: StoreVariant[];
};

export default function ProductCard({
  product,
  priority = false,
  discountById,
}: {
  product: StoreProduct;
  priority?: boolean;
  // Mapa variantId -> preço com desconto (opcional, vindo da página).
  discountById?: Record<
    string,
    { originalPrice: number; finalPrice: number; discountName: string | null }
  >;
}) {
  // Cores únicas disponíveis
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; imageUrl?: string | null }>();
    for (const v of product.variants) {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, {
          name: v.color,
          hex: v.colorHex || "#333333",
          imageUrl: v.imageUrl,
        });
      }
    }
    return Array.from(map.values());
  }, [product.variants]);

  const [activeColorImage, setActiveColorImage] = useState<string | null>(null);

  const defaultImage =
    product.imageUrl ||
    product.images?.find((img) => Boolean(img)) ||
    product.variants.find((v) => Boolean(v.imageUrl))?.imageUrl ||
    null;

  const currentImage = activeColorImage || defaultImage;

  const minPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.sellPrice)))
      : null;

  // Menor preço com desconto entre as variações.
  const minDiscounted =
    product.variants.length > 0
      ? Math.min(
          ...product.variants.map((v) => {
            const d = v.id ? discountById?.[v.id] : null;
            return d?.finalPrice ?? Number(v.sellPrice);
          })
        )
      : null;

  const hasDiscount =
    minDiscounted !== null &&
    minPrice !== null &&
    minDiscounted < minPrice;

  const hasStock =
    product.variants.length > 0 &&
    product.variants.some((v) => v.stockQuantity > 0);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md border border-base-line bg-base-raised transition-all hover:border-volt/60 hover:shadow-lg">
      <Link
        href={`/produtos/${product.id}`}
        className="flex flex-1 flex-col"
      >
        {/* Imagem do produto */}
        <div className="relative h-60 w-full overflow-hidden bg-gradient-to-br from-base-line/40 to-base bg-[#14161b] md:h-80">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Shirt
                size={48}
                className="text-ink-soft/40 transition-colors group-hover:text-volt"
                strokeWidth={1.25}
              />
            </div>
          )}

          {!hasStock && (
            <span className="absolute left-3 top-3 rounded-sm bg-alert/90 px-2 py-0.5 text-[11px] font-medium text-base">
              Esgotado
            </span>
          )}

          {hasDiscount && hasStock && (
            <span className="absolute right-3 bottom-3 rounded-sm bg-volt px-2 py-0.5 text-[11px] font-bold text-base">
              -
              {Math.round((1 - (minDiscounted ?? 0) / (minPrice ?? 1)) * 100)}%
            </span>
          )}

          <FavoriteButton
            productId={product.id}
            name={product.name}
            imageUrl={currentImage}
            price={minDiscounted ?? minPrice}
          />
        </div>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] uppercase tracking-wide text-ink-soft">
            {product.category?.name ?? "Produto"}
          </p>
          <h3 className="mt-1 font-medium text-ink transition-colors group-hover:text-volt">
            {product.name}
          </h3>

          {/* Swatches de cores (quando houver) */}
          {colors.length > 0 && (
            <div
              className="mt-2.5 flex items-center gap-1.5"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              {colors.slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onMouseEnter={() => {
                    if (c.imageUrl) setActiveColorImage(c.imageUrl);
                  }}
                  onMouseLeave={() => {
                    setActiveColorImage(null);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (c.imageUrl) {
                      setActiveColorImage(c.imageUrl);
                    }
                  }}
                  className="group/swatch relative h-4 w-4 rounded-full border border-white/25 transition-transform hover:scale-125 focus:outline-none"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="sr-only">{c.name}</span>
                </button>
              ))}
              {colors.length > 5 && (
                <span className="text-[10px] text-ink-soft">
                  +{colors.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3">
            {minPrice !== null ? (
              <div>
                {hasDiscount ? (
                  <p className="text-xs text-volt font-medium">
                    {currency(minDiscounted)}
                    <span className="ml-2 line-through text-ink-soft/60">
                      {currency(minPrice)}
                    </span>
                  </p>
                ) : (
                  <p className="font-display text-lg text-ink">{currency(minPrice)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">Consultar</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
