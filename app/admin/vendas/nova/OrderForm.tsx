"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, ShoppingBag, User, CreditCard, Tag, Gift as GiftIcon } from "lucide-react";
import { createOrder } from "@/lib/actions";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  loyaltyPoints: number;
}

interface Variant {
  id: string;
  sku: string;
  costPrice: any;
  sellPrice: any;
  stockQuantity: number;
  product: {
    id: string;
    name: string;
    categoryId: string;
  };
  attributeValues: {
    attributeValue: {
      value: string;
    };
  }[];
}

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: any;
  minPurchase: any;
  maxUses: number | null;
  usedCount: number;
}

interface Gift {
  id: string;
  name: string;
  description?: string | null;
  stockQuantity: number;
  minPurchaseValue?: any;
  minLoyaltyPoints?: number | null;
  productId?: string | null;
  categoryId?: string | null;
}

interface OrderItemRow {
  rowId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OrderForm({
  customers,
  variants,
  coupons,
  gifts,
}: {
  customers: Customer[];
  variants: Variant[];
  coupons: Coupon[];
  gifts: Gift[];
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedGiftIds, setSelectedGiftIds] = useState<string[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [installments, setInstallments] = useState<number>(1);
  const [status, setStatus] = useState<string>("PAID");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<OrderItemRow[]>([
    {
      rowId: "1",
      variantId: variants[0]?.id || "",
      quantity: 1,
      unitPrice: variants[0] ? Number(variants[0].sellPrice) : 0,
    },
  ]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  function addItem() {
    const defaultVariant = variants[0];
    setItems((prev) => [
      ...prev,
      {
        rowId: String(Date.now()),
        variantId: defaultVariant ? defaultVariant.id : "",
        quantity: 1,
        unitPrice: defaultVariant ? Number(defaultVariant.sellPrice) : 0,
      },
    ]);
  }

  function removeItem(rowId: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.rowId !== rowId));
  }

  function handleVariantChange(rowId: string, variantId: string) {
    const v = variants.find((item) => item.id === variantId);
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId
          ? {
              ...item,
              variantId,
              unitPrice: v ? Number(v.sellPrice) : 0,
            }
          : item
      )
    );
  }

  function handleQuantityChange(rowId: string, qty: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  }

  function handlePriceChange(rowId: string, price: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, unitPrice: Math.max(0, price) } : item
      )
    );
  }

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [items]);

  const discount = useMemo(() => {
    if (!selectedCouponCode) return 0;
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === selectedCouponCode.trim().toUpperCase()
    );
    if (!coupon) return 0;

    const minRequired = coupon.minPurchase ? Number(coupon.minPurchase) : 0;
    if (subtotal < minRequired) return 0;

    if (coupon.type === "PERCENTAGE") {
      return subtotal * (Number(coupon.value) / 100);
    } else {
      return Math.min(Number(coupon.value), subtotal);
    }
  }, [selectedCouponCode, coupons, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const estimatedPoints = useMemo(() => Math.floor(total / 10), [total]);

  // Dados do carrinho para verificar elegibilidade dos brindes
  const cartProducts = useMemo(
    () => {
      const seen = new Map<string, { productId: string; categoryId: string }>();
      for (const item of items) {
        const variant = variants.find((x) => x.id === item.variantId);
        if (variant && !seen.has(variant.product.id)) {
          seen.set(variant.product.id, {
            productId: variant.product.id,
            categoryId: variant.product.categoryId,
          });
        }
      }
      return Array.from(seen.values());
    },
    [items, variants]
  );

  // Um brinde pode ter alvo (produto/categoria) e uma condição de compra/pontos.
  // O alvo sempre precisa coincidir; condições adicionais também precisam ser atendidas.
  const eligibleGiftIds = useMemo(() => {
    const customerPoints = selectedCustomer?.loyaltyPoints ?? 0;

    return gifts
      .filter((gift) => {
        const matchesProduct = gift.productId
          ? cartProducts.some((p) => p.productId === gift.productId)
          : true;
        const matchesCategory = gift.categoryId
          ? cartProducts.some((p) => p.categoryId === gift.categoryId)
          : true;
        const hasPurchaseOrPointsRule = Boolean(
          gift.minPurchaseValue || gift.minLoyaltyPoints
        );
        const meetsPurchaseRule = gift.minPurchaseValue
          ? total >= Number(gift.minPurchaseValue)
          : false;
        const meetsPointsRule = gift.minLoyaltyPoints
          ? customerPoints >= gift.minLoyaltyPoints
          : false;
        const meetsQualification = hasPurchaseOrPointsRule
          ? meetsPurchaseRule || meetsPointsRule
          : true;

        return matchesProduct && matchesCategory && meetsQualification;
      })
      .map((gift) => gift.id);
  }, [gifts, total, selectedCustomer, cartProducts]);

  // Auto-select: brindes elegíveis ficam ativos automaticamente
  useEffect(() => {
    setSelectedGiftIds((prev) => {
      const added = eligibleGiftIds.filter((id) => !prev.includes(id));
      // Remove brindes que deixaram de ser elegíveis (ex: removeu produto do carrinho)
      const kept = prev.filter((id) => eligibleGiftIds.includes(id));
      return added.length > 0 || kept.length !== prev.length
        ? [...kept, ...added]
        : prev;
    });
  }, [eligibleGiftIds]);

  return (
    <form
      action={createOrder}
      onSubmit={() => setLoading(true)}
      className="space-y-8"
    >
      {/* Cliente & Atendimento */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <User size={16} className="text-volt" />
          <span>Cliente & Identificação</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Selecionar Cliente
            </label>
            <select
              name="customerId"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Cliente Avulso (Não identificado)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""} - {c.loyaltyPoints} pts
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-4 p-3 rounded-sm border border-base-line bg-base text-xs text-ink">
              <div>
                <span className="text-ink-soft block">Pontos acumulados</span>
                <span className="text-volt font-medium text-sm">
                  {selectedCustomer.loyaltyPoints} pontos
                </span>
              </div>
              {selectedCustomer.phone && (
                <div className="border-l border-base-line pl-4">
                  <span className="text-ink-soft block">WhatsApp</span>
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Itens do Pedido */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <ShoppingBag size={16} className="text-volt" />
            <span>Itens da Venda</span>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
          >
            <Plus size={14} className="text-volt" />
            Adicionar produto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="pb-2 font-normal">Produto / Variação *</th>
                <th className="pb-2 font-normal">Estoque Disp.</th>
                <th className="pb-2 font-normal">Qtd. *</th>
                <th className="pb-2 font-normal">Preço Unit. (R$) *</th>
                <th className="pb-2 font-normal text-right">Subtotal</th>
                <th className="pb-2 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-line/60">
              {items.map((item) => {
                const currentVariant = variants.find((v) => v.id === item.variantId);
                const stock = currentVariant ? currentVariant.stockQuantity : 0;
                const lineTotal = item.quantity * item.unitPrice;

                return (
                  <tr key={item.rowId}>
                    <td className="py-2.5 pr-2 min-w-[220px]">
                      <select
                        name="variantId"
                        value={item.variantId}
                        onChange={(e) =>
                          handleVariantChange(item.rowId, e.target.value)
                        }
                        className="w-full rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                      >
                        {variants.map((v) => {
                          const attrs = v.attributeValues
                            .map((av) => av.attributeValue.value)
                            .join(" / ");
                          const label = attrs
                            ? `${v.product.name} (${attrs}) - SKU: ${v.sku}`
                            : `${v.product.name} - SKU: ${v.sku}`;
                          return (
                            <option key={v.id} value={v.id}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="py-2.5 pr-2">
                      <span
                        className={`text-xs ${
                          stock <= 0
                            ? "text-alert font-medium"
                            : stock <= 3
                            ? "text-yellow-400"
                            : "text-ink-soft"
                        }`}
                      >
                        {stock} un.
                      </span>
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.rowId,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-20 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name="unitPrice"
                        step="0.01"
                        min="0"
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handlePriceChange(
                            item.rowId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2 text-right text-xs text-ink font-medium">
                      {currency(lineTotal)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.rowId)}
                        disabled={items.length <= 1}
                        className="text-ink-soft hover:text-alert disabled:opacity-30 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brindes */}
      {gifts.length > 0 && (
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <GiftIcon size={16} className="text-volt" />
            <span>Brindes Disponíveis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gifts.map((gift) => {
              const isSelected = selectedGiftIds.includes(gift.id);
              const isEligible = eligibleGiftIds.includes(gift.id);
              return (
                <label
                  key={gift.id}
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-volt/60 bg-volt/5"
                      : "border-base-line bg-base hover:bg-base/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded-sm border-base-line text-volt focus:ring-volt"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGiftIds((prev) => [...prev, gift.id]);
                      } else {
                        setSelectedGiftIds((prev) => prev.filter((id) => id !== gift.id));
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink truncate">{gift.name}</p>
                      {isEligible && (
                        <span className="text-[10px] uppercase tracking-wider bg-volt/10 text-volt px-1.5 py-0.5 rounded-sm border border-volt/20 font-medium">
                          Elegível
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {isEligible ? "✓ Ativado automaticamente" : gift.minPurchaseValue
                        ? `Compras acima de ${currency(Number(gift.minPurchaseValue))}`
                        : gift.minLoyaltyPoints
                        ? `Troca por ${gift.minLoyaltyPoints} pts`
                        : "Disponível"}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-volt">
                    {gift.stockQuantity} un.
                  </span>
                </label>
              );
            })}
          </div>

          {/* Inputs ocultos para enviar giftIds no form */}
          {selectedGiftIds.map((id) => (
            <input key={id} type="hidden" name="giftId" value={id} />
          ))}
        </div>
      )}

      {/* Pagamento, Cupom e Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pagamento e Status */}
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <CreditCard size={16} className="text-volt" />
            <span>Forma de Pagamento & Status</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Método de Pagamento
              </label>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="PIX">PIX (À vista)</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="CASH">Dinheiro</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="STORE_CREDIT">Crédito de Loja / Troca</option>
              </select>
            </div>

            {paymentMethod === "CREDIT_CARD" && (
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">
                  Parcelamento
                </label>
                <select
                  name="installments"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                  className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <option key={i} value={i}>
                      {i}x de {currency(total / i)} {i === 1 ? "(à vista)" : "sem juros"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Status Inicial do Pedido
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="PAID">Pago (Baixa imediata no estoque)</option>
                <option value="PENDING">Pendente (Aguardando pagamento)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cupons & Totais */}
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <Tag size={16} className="text-volt" />
            <span>Desconto & Resumo Financeiro</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Cupom Promocional (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="couponCode"
                  value={selectedCouponCode}
                  onChange={(e) => setSelectedCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PRIMEIRACOMPRA"
                  className="flex-1 rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink uppercase focus:border-volt focus:outline-none font-mono"
                />
              </div>
              {selectedCouponCode && discount > 0 && (
                <p className="text-xs text-volt mt-1">
                  Cupom aplicado com sucesso (-{currency(discount)})
                </p>
              )}
            </div>

            <div className="border-t border-base-line pt-3 space-y-2 text-xs text-ink">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} itens):</span>
                <span>{currency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-volt">
                  <span>Desconto cupom:</span>
                  <span>- {currency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-semibold text-ink border-t border-base-line pt-2">
                <span>Total a pagar:</span>
                <span className="text-volt text-base">{currency(total)}</span>
              </div>

              {selectedCustomerId && status === "PAID" && (
                <p className="text-[11px] text-ink-soft pt-1">
                  🎁 Esta venda renderá{" "}
                  <strong className="text-ink">{estimatedPoints} pontos</strong> para o cliente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/vendas"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para vendas
        </Link>

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Processando venda..." : "Finalizar e Registrar Venda"}
        </button>
      </div>
    </form>
  );
}
