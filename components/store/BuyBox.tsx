"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Heart, Check } from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { useFavorites } from "@/components/store/FavoritesProvider";
import { currency } from "@/lib/format";

export type BuyBoxVariant = {
  id: string;
  sku: string;
  sellPrice: number;
  stockQuantity: number;
};

export default function BuyBox({
  productId,
  productName,
  imageUrl,
  variants,
  discountById,
}: {
  productId: string;
  productName: string;
  imageUrl: string | null;
  variants: BuyBoxVariant[];
  // Mapa variantId -> { originalPrice, finalPrice, discountId, discountName }
  discountById?: Record<
    string,
    { originalPrice: number; finalPrice: number; discountId: string | null; discountName: string | null }
  >;
}) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  // Preço efetivo (com desconto) para exibição e adição ao carrinho.
  const effectivePrice = (v: BuyBoxVariant) =>
    discountById?.[v.id]?.finalPrice ?? v.sellPrice;

  const inStock = variants.filter((v) => v.stockQuantity > 0);
  const [selectedId, setSelectedId] = useState<string | null>(
    inStock[0]?.id ?? null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const maxStock = selected ? Math.min(selected.stockQuantity, 99) : 0;

  const handleAdd = () => {
    if (!selected) return;
    const price = effectivePrice(selected);
    add(
      {
        key: selected.id,
        productId,
        variantId: selected.id,
        name: productName,
        sku: selected.sku,
        imageUrl,
        price,
        maxStock,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mt-8">
      {/* Seleção de variação */}
      {variants.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-ink">
            Variação{" "}
            <span className="font-normal text-ink-soft">
              {selected ? `· ${selected.sku}` : ""}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = v.stockQuantity <= 0;
              const activeSel = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    if (out) return;
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  disabled={out}
                  title={
                    out
                      ? `${v.sku} — sem estoque`
                      : `${v.sku} · ${currency(effectivePrice(v))} · ${v.stockQuantity} em estoque`
                  }
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                    out
                      ? "border-base-line/40 bg-base text-ink-soft/40 line-through"
                      : activeSel
                        ? "border-volt bg-volt/10 text-ink"
                        : "border-base-line bg-base-raised text-ink-soft hover:border-volt/60 hover:text-ink"
                  }`}
                >
                  {activeSel && !out && <Check size={13} className="mr-1 inline text-volt" />}
                  {v.sku}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Produto sem variações cadastradas.</p>
      )}

      {/* Favoritar */}
      <button
        onClick={() =>
          toggle({
            id: productId,
            name: productName,
            imageUrl,
            price: variants.length ? Math.min(...variants.map((v) => effectivePrice(v))) : null,
          })
        }
        className={`mt-4 inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
          isFavorite(productId)
            ? "border-alert/60 bg-alert/10 text-alert"
            : "border-base-line bg-base-raised text-ink-soft hover:border-alert/60 hover:text-alert"
        }`}
      >
        <Heart size={15} fill={isFavorite(productId) ? "currentColor" : "none"} />
        {isFavorite(productId) ? "Salvo nos favoritos" : "Adicionar aos favoritos"}
      </button>

      {/* Desconto ativo na variação selecionada */}
      {selected &&
        discountById?.[selected.id] &&
        discountById[selected.id].finalPrice < discountById[selected.id].originalPrice && (
          <div className="mt-4 rounded-sm border border-volt/30 bg-volt/5 px-3 py-2 text-sm">
            <p className="font-medium text-volt">
              {discountById[selected.id].discountName ?? "Promoção ativa"}
            </p>
            <p className="text-ink-soft">
              De <span className="line-through">{currency(discountById[selected.id].originalPrice)}</span>{" "}
              por <span className="font-medium text-ink">{currency(discountById[selected.id].finalPrice)}</span>
            </p>
          </div>
        )}

      {/* Quantidade + carrinho */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-sm border border-base-line">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="grid h-11 w-10 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            <Minus size={15} />
          </button>
          <span className="grid h-11 min-w-10 place-items-center text-sm text-ink">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(maxStock || q, q + 1))}
            disabled={qty >= maxStock}
            className="grid h-11 w-10 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={!selected || selected.stockQuantity <= 0}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
            added ? "bg-volt-dim text-base" : "bg-volt text-base hover:bg-volt-dim"
          }`}
        >
          {added ? (
            <>
              <Check size={16} /> Adicionado!
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              {selected && selected.stockQuantity > 0
                ? `Adicionar por ${currency(effectivePrice(selected))}`
                : "Produto esgotado"}
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        {selected
          ? `${selected.sku} · ${selected.stockQuantity} un. em estoque`
          : "Selecione uma variação disponível."}
      </p>
    </div>
  );
}
