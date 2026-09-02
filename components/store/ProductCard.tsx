import Link from "next/link";
import { currency } from "@/lib/format";
import { Shirt } from "lucide-react";
import FavoriteButton from "@/components/store/FavoriteButton";

// Tipo mínimo esperado de um produto no card da loja.
// sellPrice aceita number ou o Decimal do Prisma (que tem toString()).
export type StoreVariant = {
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
}: {
  product: StoreProduct;
  priority?: boolean;
}) {
  const minPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.sellPrice)))
      : null;
  const hasStock =
    product.variants.length > 0 &&
    product.variants.some((v) => v.stockQuantity > 0);
  const productImage =
    product.imageUrl || product.images?.find((image) => Boolean(image)) || null;

  return (
    <Link
      href={`/produtos/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-base-line bg-base-raised transition-all hover:border-volt/60 hover:shadow-lg"
    >
      {/* Imagem do produto */}
      <div className="relative h-60 w-full overflow-hidden bg-gradient-to-br from-base-line/40 to-base bg-[#14161b] md:h-80">
        {productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImage}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Shirt size={48} className="text-ink-soft/40 transition-colors group-hover:text-volt" strokeWidth={1.25} />
          </div>
        )}
        {!hasStock && (
          <span className="absolute left-3 top-3 rounded-sm bg-alert/90 px-2 py-0.5 text-[11px] font-medium text-base">
            Esgotado
          </span>
        )}
        <FavoriteButton
          productId={product.id}
          name={product.name}
          imageUrl={productImage}
          price={minPrice}
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
        <div className="mt-auto pt-3">
          {minPrice !== null ? (
            <p className="font-display text-lg text-ink">{currency(minPrice)}</p>
          ) : (
            <p className="text-sm text-ink-soft">Consultar</p>
          )}
        </div>
      </div>
    </Link>
  );
}
