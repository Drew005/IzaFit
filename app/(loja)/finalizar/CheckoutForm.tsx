"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  ShoppingBag,
  MapPin,
  CheckCircle2,
  Shirt,
  QrCode,
  CreditCard,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { checkout } from "@/lib/checkout";
import { validateCoupon } from "@/lib/actions/coupon";
import { currency } from "@/lib/format";
import CardPaymentBrick from "@/components/store/CardPaymentBrick";

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

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  PIX: <QrCode size={15} className="text-volt" />,
  CREDIT_CARD: <CreditCard size={15} className="text-volt" />,
  BOLETO: <FileText size={15} className="text-volt" />,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-sm bg-volt px-4 py-3 text-sm font-medium text-base transition-colors hover:bg-volt-dim disabled:opacity-50"
    >
      {pending ? "Confirmando pedido..." : "Confirmar pedido e gerar pagamento"}
    </button>
  );
}

// Botão copiar PIX copia-e-cola com feedback visual
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) — ignora
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-sm border border-volt/40 bg-volt/10 px-3 py-1.5 text-xs font-medium text-volt transition-colors hover:bg-volt/20"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

function formatCep(cep: string) {
  const c = cep.replace(/\D/g, "");
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep;
}

export default function CheckoutForm({
  customerName,
  mpPublicKey,
  addresses,
}: {
  customerName: string;
  mpPublicKey: string;
  addresses: Address[];
}) {
  const { items, subtotal, clear } = useCart();
  const [state, formAction] = useFormState(checkout, null);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<{
    code: string;
    discount: number;
    newTotal: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Valor total a cobrar (já com desconto do cupom, se houver) — usado no Brick.
  const totalAmount =
    couponResult && couponResult.newTotal > 0
      ? Math.round(couponResult.newTotal * 100)
      : Math.round(subtotal * 100);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(code, subtotal);
      if ("error" in result) {
        setCouponError(result.error || "Erro desconhecido");
        setCouponResult(null);
      } else {
        setCouponResult(result);
        setCouponError(null);
      }
    } catch (e) {
      setCouponError("Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (!couponCode) {
      setCouponResult(null);
      setCouponError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await validateCoupon(couponCode, subtotal);
        if ("error" in result) {
          setCouponError(result.error || "Erro desconhecido");
          setCouponResult(null);
        } else {
          setCouponResult(result);
          setCouponError(null);
        }
      } catch (e) {
        setCouponError("Erro ao validar cupom.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [couponCode, subtotal]);

  const defaultAddressId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "";

  // Estado do processamento do cartão (Card Payment Brick)
  const [cardResult, setCardResult] = useState<{
    ok: boolean;
    simulated?: boolean;
    message?: string;
  } | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardProcessed = (result: {
    ok: boolean;
    simulated?: boolean;
    message?: string;
  }) => {
    setCardResult(result);
    setCardError(null);
  };

  const handleCardError = (message: string) => {
    setCardError(message);
  };

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
              Pedido #{state.orderId?.slice(-6)} criado!
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {state.requiresCardProcessing
                ? "Informe os dados do cartão abaixo para concluir o pagamento."
                : state.payment?.simulated
                  ? "Pagamento em modo de demonstração — finalize para concluir a compra."
                  : "Seu pagamento foi gerado. Conclua o pagamento abaixo para confirmar o pedido."}
            </p>

            {/* Detalhes do Pagamento */}
            <div className="mt-8 rounded-lg border border-base-line bg-base p-6">
              <h3 className="text-sm font-medium text-ink">Detalhes do pagamento</h3>
              
              {state.payment?.method === "PIX" && (
                <div className="mt-4 text-center">
                  {state.payment.pixQrCodeBase64 && (
                    <img
                      src={state.payment.pixQrCodeBase64}
                      alt="QR Code PIX"
                      className="mx-auto h-48 w-48 rounded-sm border border-base-line bg-white object-contain"
                    />
                  )}
                  <p className="mt-4 text-xs text-ink-soft">Escaneie o QR Code ou use o código abaixo:</p>
                  {state.payment.pixCode && (
                    <div className="mt-2 flex items-center gap-2 rounded-sm border border-base-line bg-base px-3 py-2 text-left">
                      <code className="flex-1 truncate text-xs text-ink-soft">
                        {state.payment.pixCode}
                      </code>
                      <CopyButton text={state.payment.pixCode} />
                    </div>
                  )}
                </div>
              )}

              {state.payment?.method === "BOLETO" && state.payment.boletoUrl && (
                <div className="mt-4 text-center">
                  <a
                    href={state.payment.boletoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
                  >
                    <FileText size={16} />
                    Ver boleto
                  </a>
                </div>
              )}
              
              {state.payment?.method === "CREDIT_CARD" && (
                <p className="mt-4 text-sm text-ink-soft">Pagamento via cartão de crédito processado.</p>
              )}

              {/* Fluxo do cartão: aguarda o Card Payment Brick processar */}
              {state.requiresCardProcessing && state.orderId && (
                <div className="mt-4 text-left">
                  {cardResult?.ok ? (
                    <div className="rounded-sm border border-volt/40 bg-volt/10 p-4">
                      <p className="flex items-center justify-center gap-2 font-medium text-ink">
                        <CheckCircle2 size={18} className="text-volt" />
                        {cardResult.simulated
                          ? "Pagamento simulado (modo demonstração)."
                          : cardResult.message ?? "Pagamento aprovado!"}
                      </p>
                      {cardResult.simulated && (
                        <p className="mt-1 text-center text-xs text-ink-soft">
                          Nenhum valor foi cobrado.
                        </p>
                      )}
                    </div>
                  ) : (
                    <CardPaymentBrick
                      amount={state.orderTotal ?? totalAmount}
                      orderId={state.orderId}
                      publicKey={mpPublicKey}
                      onProcessed={handleCardProcessed}
                      onError={handleCardError}
                    />
                  )}
                  {cardError && (
                    <p className="mt-3 rounded-sm border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
                      {cardError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center gap-3">
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
            {/* Nova Seleção de Pagamento */}
            <div className="space-y-4">
              <span className="text-sm font-medium text-ink">Escolha como pagar</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-base-line bg-base p-4 transition-all hover:border-volt/60 has-[:checked]:border-volt has-[:checked]:bg-volt/5"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={value}
                      defaultChecked={value === "PIX"}
                      className="peer absolute opacity-0"
                    />
                    <div className="text-volt">{PAYMENT_ICONS[value]}</div>
                    <span className="text-xs font-medium text-ink">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-ink-soft">Cupom de desconto</span>
              <div className="mt-1 flex gap-2">
                <input
                  name="couponCode"
                  type="text"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setCouponResult(null);
                    setCouponError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  placeholder="Ex: IZAFIT10"
                  className="min-w-0 flex-1 rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink uppercase focus:border-volt focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="shrink-0 rounded-sm border border-volt/50 px-3 py-2 text-xs font-medium text-volt transition-colors hover:bg-volt/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validatingCoupon ? "Validando..." : "Aplicar cupom"}
                </button>
              </div>
              {couponResult && (
                <p className="mt-2 text-xs text-volt">{couponResult.message}</p>
              )}
              {couponError && (
                <p className="mt-2 text-xs text-alert">{couponError}</p>
              )}
            </div>
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
          {couponResult ? (
            <>
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  Cupom <span className="font-medium text-volt">{couponResult.code}</span>
                </dt>
                <dd className="text-volt">-{currency(couponResult.discount)}</dd>
              </div>
              <div className="flex justify-between border-t border-base-line pt-2">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-display text-lg font-bold text-ink">{currency(couponResult.newTotal)}</dd>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Total</dt>
              <dd className="font-display text-lg font-bold text-ink">{currency(subtotal)}</dd>
            </div>
          )}
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