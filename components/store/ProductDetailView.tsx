"use client";

import { useState, useMemo } from "react";
import { Check, Heart, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { currency } from "@/lib/format";
import { useCart } from "@/components/store/CartProvider";
import { useFavorites } from "@/components/store/FavoritesProvider";
import ProductGallery from "@/components/store/ProductGallery";

export type ProductDetailVariant = {
  id: string;
  sku: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  sellPrice: number;
  stockQuantity: number;
};

export type ProductDetailData = {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  category?: { name: string } | null;
  imageUrl?: string | null;
  images?: string[];
  variants: ProductDetailVariant[];
};

export default function ProductDetailView({
  product,
  productImages,
  discountById,
}: {
  product: ProductDetailData;
  productImages: string[];
  discountById?: Record<
    string,
    {
      originalPrice: number;
      finalPrice: number;
      discountId: string | null;
      discountName: string | null;
    }
  >;
}) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const effectivePrice = (v: ProductDetailVariant) =>
    discountById?.[v.id]?.finalPrice ?? v.sellPrice;

  // Agrupa as cores disponíveis nas variações
  const colorOptions = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; imageUrl?: string | null }>();
    for (const v of product.variants) {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, {
          name: v.color,
          hex: v.colorHex || "#000000",
          imageUrl: v.imageUrl,
        });
      }
    }
    return Array.from(map.values());
  }, [product.variants]);

  const hasColors = colorOptions.length > 0;

  // Estado da cor selecionada (inicia com a cor da primeira variação com estoque, ou primeira cor)
  const initialVariant =
    product.variants.find((v) => v.stockQuantity > 0) || product.variants[0];

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialVariant?.color || colorOptions[0]?.name || null
  );

  // Variações filtradas pela cor selecionada (se houver cores)
  const availableVariantsForColor = useMemo(() => {
    if (!hasColors || !selectedColor) return product.variants;
    return product.variants.filter((v) => v.color === selectedColor);
  }, [product.variants, hasColors, selectedColor]);

  // Variação selecionada ativa
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    availableVariantsForColor.find((v) => v.stockQuantity > 0)?.id ||
      availableVariantsForColor[0]?.id ||
      null
  );

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    availableVariantsForColor[0] ||
    null;

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Imagem ativa para a galeria: se a cor/variação tiver foto própria, coloca como primeira
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (selectedVariant?.imageUrl) {
      list.push(selectedVariant.imageUrl);
    } else if (selectedColor) {
      const colorImg = colorOptions.find((c) => c.name === selectedColor)?.imageUrl;
      if (colorImg) list.push(colorImg);
    }
    for (const img of productImages) {
      if (!list.includes(img)) list.push(img);
    }
    // Adiciona outras fotos de variantes
    for (const v of product.variants) {
      if (v.imageUrl && !list.includes(v.imageUrl)) {
        list.push(v.imageUrl);
      }
    }
    return list.filter(Boolean);
  }, [selectedVariant, selectedColor, colorOptions, productImages, product.variants]);

  // Troca de cor: atualiza cor e seleciona o primeiro tamanho disponível daquela cor
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    const colorVars = product.variants.filter((v) => v.color === colorName);
    const inStock = colorVars.find((v) => v.stockQuantity > 0) || colorVars[0];
    if (inStock) {
      setSelectedVariantId(inStock.id);
    }
    setQty(1);
  };

  const maxStock = selectedVariant ? Math.min(selectedVariant.stockQuantity, 99) : 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;
    const price = effectivePrice(selectedVariant);
    const chosenImage = selectedVariant.imageUrl || galleryImages[0] || null;

    let itemDisplayName = product.name;
    if (selectedVariant.color && selectedVariant.size) {
      itemDisplayName = `${product.name} - ${selectedVariant.color} (${selectedVariant.size})`;
    } else if (selectedVariant.color) {
      itemDisplayName = `${product.name} - ${selectedVariant.color}`;
    } else if (selectedVariant.size) {
      itemDisplayName = `${product.name} (${selectedVariant.size})`;
    }

    add(
      {
        key: selectedVariant.id,
        productId: product.id,
        variantId: selectedVariant.id,
        name: itemDisplayName,
        sku: selectedVariant.sku,
        imageUrl: chosenImage,
        price,
        maxStock,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const currentMinPrice = selectedVariant
    ? Number(selectedVariant.sellPrice)
    : Math.min(...product.variants.map((v) => Number(v.sellPrice)));

  const currentFinalPrice = selectedVariant
    ? effectivePrice(selectedVariant)
    : Math.min(...product.variants.map((v) => effectivePrice(v)));

  const hasDiscount = currentFinalPrice < currentMinPrice;

  return (
    <div className="mt-6 grid gap-10 md:grid-cols-2">
      {/* Galeria de Fotos Interativa */}
      <ProductGallery
        images={galleryImages}
        name={product.name}
        esgotado={product.variants.every((v) => v.stockQuantity <= 0)}
      />

      {/* Detalhes & Seleção */}
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

        <p className="mt-4 text-base text-ink-soft md:text-lg">
          {product.description ||
            "Peça de alta performance e conforto desenvolvida para os seus treinos."}
        </p>

        {/* Bloco de Preço */}
        <div className="mt-6 rounded-md border border-base-line bg-base-raised p-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {hasDiscount && (
              <span className="line-through text-ink-soft text-lg">
                {currency(currentMinPrice)}
              </span>
            )}
            <p className="font-display text-3xl font-bold text-volt">
              {currency(currentFinalPrice)}
            </p>
            {hasDiscount && (
              <span className="rounded-full bg-volt/20 border border-volt/30 px-2 py-0.5 text-xs font-semibold text-volt">
                {Math.round((1 - currentFinalPrice / currentMinPrice) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            {!isOutOfStock ? (
              <>
                <Check size={15} className="text-volt" />
                <span className="text-ink">
                  Em estoque{" "}
                  {selectedVariant && `· ${selectedVariant.stockQuantity} unidades`}
                </span>
              </>
            ) : (
              <span className="text-alert font-medium">Esta opção está esgotada</span>
            )}
          </div>
        </div>

        {/* Seletores de Cor e Tamanho */}
        <div className="mt-6 space-y-5">
          {/* Seletor de Cores */}
          {hasColors && (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">
                  Cor:{" "}
                  <span className="font-semibold text-volt">{selectedColor}</span>
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {colorOptions.map((c) => {
                  const isSelected = c.name === selectedColor;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleColorChange(c.name)}
                      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-volt bg-volt/10 text-ink shadow-[0_0_0_1px_rgba(200,255,77,0.4)]"
                          : "border-base-line bg-base-raised text-ink-soft hover:border-volt/50 hover:text-ink"
                      }`}
                    >
                      {/* Amostra da Cor (bolinha ou foto) */}
                      {c.imageUrl ? (
                        <span className="h-4 w-4 shrink-0 rounded-full overflow-hidden border border-white/20">
                          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                        </span>
                      ) : (
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                      )}
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seletor de Tamanhos / Variações */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">
                {hasColors ? "Tamanho" : "Variação"}
                {selectedVariant && (
                  <span className="font-normal text-ink-soft ml-1.5">
                    · {selectedVariant.size || selectedVariant.sku}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {availableVariantsForColor.map((v) => {
                const out = v.stockQuantity <= 0;
                const isSelected = v.id === selectedVariantId;
                const label = v.size || v.sku;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      if (out) return;
                      setSelectedVariantId(v.id);
                      setQty(1);
                    }}
                    disabled={out}
                    title={
                      out
                        ? `${label} — Esgotado`
                        : `${label} · ${currency(effectivePrice(v))} (${v.stockQuantity} em estoque)`
                    }
                    className={`min-w-12 rounded-sm border px-3 py-2 text-center text-xs font-medium transition-all ${
                      out
                        ? "border-base-line/40 bg-base text-ink-soft/40 line-through cursor-not-allowed"
                        : isSelected
                          ? "border-volt bg-volt/10 text-ink shadow-[0_0_0_1px_rgba(200,255,77,0.4)]"
                          : "border-base-line bg-base-raised text-ink-soft hover:border-volt/60 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Favoritar */}
        <button
          onClick={() =>
            toggle({
              id: product.id,
              name: product.name,
              imageUrl: galleryImages[0] ?? null,
              price: currentFinalPrice,
            })
          }
          className={`mt-6 inline-flex items-center gap-2 rounded-sm border px-3.5 py-2 text-xs font-medium transition-colors w-fit ${
            isFavorite(product.id)
              ? "border-alert/60 bg-alert/10 text-alert"
              : "border-base-line bg-base-raised text-ink-soft hover:border-alert/60 hover:text-alert"
          }`}
        >
          <Heart size={14} fill={isFavorite(product.id) ? "currentColor" : "none"} />
          {isFavorite(product.id) ? "Salvo nos favoritos" : "Adicionar aos favoritos"}
        </button>

        {/* Quantidade + Botão Comprar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-sm border border-base-line bg-base-raised">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1 || isOutOfStock}
              className="grid h-11 w-10 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
            >
              <Minus size={15} />
            </button>
            <span className="grid h-11 min-w-10 place-items-center text-sm font-medium text-ink">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(maxStock || q, q + 1))}
              disabled={qty >= maxStock || isOutOfStock}
              className="grid h-11 w-10 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
              added
                ? "bg-volt-dim text-base"
                : "bg-volt text-base hover:bg-volt-dim shadow-sm hover:shadow-volt/20"
            }`}
          >
            {added ? (
              <>
                <Check size={16} /> Adicionado ao carrinho!
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                {!isOutOfStock
                  ? `Comprar por ${currency(currentFinalPrice * qty)}`
                  : "Produto esgotado"}
              </>
            )}
          </button>
        </div>

        {/* Garantias */}
        <div className="mt-8 grid grid-cols-3 gap-3 border-t border-base-line pt-6 text-center">
          <div>
            <Truck size={18} className="mx-auto text-volt" />
            <p className="mt-1.5 text-xs text-ink-soft">
              Entrega p/ Morro de São Paulo e Valença
            </p>
          </div>
          <div>
            <ShieldCheck size={18} className="mx-auto text-volt" />
            <p className="mt-1.5 text-xs text-ink-soft">Compra 100% segura</p>
          </div>
          <div>
            <RotateCcw size={18} className="mx-auto text-volt" />
            <p className="mt-1.5 text-xs text-ink-soft">Trocas e devoluções fáceis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
