"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, Truck, PackageCheck } from "lucide-react";
import { createPurchase } from "@/lib/actions";

interface Supplier {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  sku: string;
  costPrice: any;
  stockQuantity: number;
  product: {
    name: string;
  };
  attributeValues: {
    attributeValue: {
      value: string;
    };
  }[];
}

interface PurchaseItemRow {
  rowId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
}

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PurchaseForm({
  suppliers,
  variants,
}: {
  suppliers: Supplier[];
  variants: Variant[];
}) {
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || "");
  const [status, setStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<PurchaseItemRow[]>([
    {
      rowId: "1",
      variantId: variants[0]?.id || "",
      quantity: 10,
      unitCost: variants[0] ? Number(variants[0].costPrice) : 0,
    },
  ]);

  function addItem() {
    const defaultVariant = variants[0];
    setItems((prev) => [
      ...prev,
      {
        rowId: String(Date.now()),
        variantId: defaultVariant ? defaultVariant.id : "",
        quantity: 10,
        unitCost: defaultVariant ? Number(defaultVariant.costPrice) : 0,
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
              unitCost: v ? Number(v.costPrice) : 0,
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

  function handleCostChange(rowId: string, cost: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, unitCost: Math.max(0, cost) } : item
      )
    );
  }

  const totalCost = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  }, [items]);

  return (
    <form
      action={createPurchase}
      onSubmit={() => setLoading(true)}
      className="space-y-8"
    >
      {/* Fornecedor & Status */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Truck size={16} className="text-volt" />
          <span>Dados do Pedido de Compra</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Fornecedor *
            </label>
            <select
              name="supplierId"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs text-alert mt-1">
                Nenhum fornecedor cadastrado.{" "}
                <Link href="/admin/compras/fornecedores/novo" className="underline">
                  Cadastre um agora
                </Link>
                .
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Status da Compra *
            </label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="PENDING">Pendente (Aguardando chegada do pedido)</option>
              <option value="RECEIVED">
                Recebido (Dar entrada imediata no estoque)
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Observações / Número da Nota Fiscal
            </label>
            <input
              type="text"
              name="notes"
              placeholder="Ex: NF-e 12345, frete FOB, previsão de entrega..."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Itens Comprados */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <PackageCheck size={16} className="text-volt" />
            <span>Itens da Compra</span>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
          >
            <Plus size={14} className="text-volt" />
            Adicionar item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="pb-2 font-normal">Variação de Produto *</th>
                <th className="pb-2 font-normal">Qtd. Comprada *</th>
                <th className="pb-2 font-normal">Custo Unitário (R$) *</th>
                <th className="pb-2 font-normal text-right">Subtotal</th>
                <th className="pb-2 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-line/60">
              {items.map((item) => {
                const lineTotal = item.quantity * item.unitCost;

                return (
                  <tr key={item.rowId}>
                    <td className="py-2.5 pr-2 min-w-[240px]">
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
                        className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        name="unitCost"
                        step="0.01"
                        min="0"
                        required
                        value={item.unitCost}
                        onChange={(e) =>
                          handleCostChange(
                            item.rowId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-28 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
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

        {/* Resumo do Custo */}
        <div className="border-t border-base-line pt-4 flex items-center justify-between">
          <span className="text-xs text-ink-soft">
            Total de {items.reduce((acc, i) => acc + i.quantity, 0)} unidades em {items.length} variações.
          </span>
          <div className="text-right">
            <span className="text-xs text-ink-soft block">Custo Total da Compra:</span>
            <span className="text-volt font-semibold text-lg">{currency(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/compras"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para compras
        </Link>

        <button
          type="submit"
          disabled={loading || items.length === 0 || suppliers.length === 0}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Registrando compra..." : "Registrar Compra"}
        </button>
      </div>
    </form>
  );
}
