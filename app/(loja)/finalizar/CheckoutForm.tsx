"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ShoppingBag, MapPin, CheckCircle2, Shirt } from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { checkout } from "@/lib/checkout";
import { currency } from "@/lib/format";

type Address = {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-sm bg-volt px-4 py-3 text-sm font-medium text-base transition-colors hover:bg-volt-dim disabled:opacity-50"
    >
      {pending ? "Confirmando pedido..." : "Confirmar pedido"}
    </button>
  );
}

function formatCep(cep: string) {
  const c = cep.replace(/\D/g, "");
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep;
}

export default function CheckoutForm({
  customerName,
  addresses,
}: {
  customerName: string;
  addresses: Address[];
}) {
  const { items, subtotal, clear } = useCart();
  const [state, formAction] = useFormState(checkout, null);

  const defaultAddressId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "";

  // Após pedido confirmado, limpa o carrinho local.
  useEffect(() => {
    if (state?.success) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-md border border-base-line bg-base-raised p-10 text-center">
        {state?.success ? (
          <>
            <CheckCircle2 size={40} className="mx-auto text-volt" />
            <h2 className="mt-4 font-display text-xl font-bold text-ink">
              Pedido confirmado!
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Seu pedido #{state.orderId?.slice(-6)} foi criado com sucesso.
              Acompanhe o status em "Meus pedidos".
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/perfil"
                className="rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
              >
                Ver meus pedidos
              </Link>
              <Link
                href="/produtos"
                className="rounded-sm border border-base-line px-5 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                Continuar comprando
              </Link>
            </div>
          </>
        ) : (
          <>
            <ShoppingBag size={40} className="mx-auto text-ink-soft/40" />
            <p className="mt-4 text-ink-soft">Seu carrinho está vazio.</p>
            <Link
              href="/produtos"
              className="mt-4 inline-block rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
            >
              Ver produtos
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Itens */}
        <section className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="border-b border-base-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
              <ShoppingBag size={15} className="text-volt" />
              Itens do pedido
            </h2>
          </div>
          <ul className="divide-y divide-base-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 px-5 py-4">
                <input type="hidden" name="variantId" value={item.variantId} />
                <input type="hidden" name="quantity" value={item.qty} />
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-base-line bg-base">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <Shirt size={20} className="text-ink-soft/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">SKU {item.sku}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {item.qty} × {currency(item.price)}
                    </p>
                  </div>
                  <p className="font-display text-sm text-ink">
                    {currency(item.price * item.qty)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Endereço de entrega */}
        <section className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="flex items-center justify-between border-b border-base-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
              <MapPin size={15} className="text-volt" />
              Endereço de entrega
            </h2>
            <Link
              href="/perfil"
              className="text-xs text-ink-soft transition-colors hover:text-volt"
            >
              Gerenciar endereços
            </Link>
          </div>

          {addresses.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-ink-soft">
                Você ainda não tem endereço cadastrado.
              </p>
              <Link
                href="/perfil"
                className="mt-3 inline-block rounded-sm bg-volt px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
              >
                Cadastrar endereço
              </Link>
            </div>
          ) : (
            <div className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="text-xs text-ink-soft">Nome de quem recebe</span>
                <input
                  name="recipient"
                  type="text"
                  defaultValue={customerName}
                  className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
                />
              </label>

              <div className="space-y-2 pt-1">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-start gap-3 rounded-sm border border-base-line bg-base p-3 transition-colors has-[:checked]:border-volt/60 has-[:checked]:bg-volt/5"
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={a.id}
                      defaultChecked={a.id === defaultAddressId}
                      required
                      className="mt-0.5 rounded-full border-base-line text-volt focus:ring-volt"
                    />
                    <span>
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        {a.label ?? "Endereço"}
                        {a.isDefault && (
                          <span className="rounded-sm bg-volt/10 px-1.5 py-0.5 text-[10px] font-medium text-volt">
                            Principal
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        {a.street}, {a.number}
                        {a.complement ? ` — ${a.complement}` : ""}
                      </span>
                      <span className="block text-xs text-ink-soft/60">
                        {a.district} — {a.city}/{a.state} · CEP {formatCep(a.zipCode)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Pagamento + cupom */}
        <section className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="border-b border-base-line px-5 py-4">
            <h2 className="text-sm font-medium text-ink">Pagamento</h2>
          </div>
          <div className="space-y-4 px-5 py-4">
            <label className="block">
              <span className="text-xs text-ink-soft">Forma de pagamento</span>
              <select
                name="paymentMethod"
                defaultValue="PIX"
                className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-ink-soft">Cupom de desconto</span>
              <input
                name="couponCode"
                type="text"
                placeholder="Ex: IZAFIT10"
                className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink uppercase focus:border-volt focus:outline-none"
              />
            </label>
          </div>
        </section>
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
            <dt className="text-ink-soft">Desconto</dt>
            <dd className="text-ink-soft">Aplicado na confirmação</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Frete</dt>
            <dd className="text-ink-soft">Combinar</dd>
          </div>
        </dl>

        {state?.error && (
          <p className="mt-4 rounded-sm border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
            {state.error}
          </p>
        )}

        <SubmitButton />
        <p className="mt-3 text-center text-xs text-ink-soft">
          Ao confirmar, você concorda com os termos da loja. O pedido fica
          pendente até a confirmação do pagamento.
        </p>
      </aside>
    </form>
  );
}