"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Shirt } from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { currency } from "@/lib/format";

export default function CarrinhoPage() {
  const { items, remove, setQty, clear, subtotal, count } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Carrinho
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {count} {count === 1 ? "item" : "itens"} no seu carrinho
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-ink-soft transition-colors hover:text-alert"
          >
            Esvaziar carrinho
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-base-line bg-base-raised p-14 text-center">
          <ShoppingBag size={40} className="mx-auto text-ink-soft/40" />
          <p className="mt-4 text-ink-soft">Seu carrinho está vazio.</p>
          <Link
            href="/produtos"
            className="mt-4 inline-block rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Itens */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex gap-4 rounded-md border border-base-line bg-base-raised p-4"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-base-line bg-base">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Shirt size={26} className="text-ink-soft/40" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/produtos/${item.productId}`}
                        className="font-medium text-ink transition-colors hover:text-volt"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-soft">SKU {item.sku}</p>
                    </div>
                    <button
                      onClick={() => remove(item.key)}
                      className="text-ink-soft/50 transition-colors hover:text-alert"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-sm border border-base-line">
                      <button
                        onClick={() => setQty(item.key, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="grid h-8 w-8 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="grid h-8 min-w-8 place-items-center text-sm text-ink">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => setQty(item.key, item.qty + 1)}
                        disabled={item.qty >= item.maxStock}
                        className="grid h-8 w-8 place-items-center text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-display text-lg text-ink">
                      {currency(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <aside className="h-fit rounded-md border border-base-line bg-base-raised p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-medium text-ink">Resumo do pedido</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="text-ink">{currency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Frete</dt>
                <dd className="text-ink-soft">Calculado na finalização</dd>
              </div>
              <div className="flex justify-between border-t border-base-line pt-2 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-display text-ink">{currency(subtotal)}</dd>
              </div>
            </dl>
            <Link
              href="/finalizar"
              className="mt-5 block w-full rounded-sm bg-volt px-4 py-3 text-center text-sm font-medium text-base transition-colors hover:bg-volt-dim"
            >
              Finalizar compra
            </Link>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Você poderá escolher o endereço de entrega e a forma de pagamento.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
