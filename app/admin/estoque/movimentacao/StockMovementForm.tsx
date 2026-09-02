"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ArrowDownLeft, ArrowUpRight, AlertOctagon } from "lucide-react";
import { createStockMovement } from "@/lib/actions";

interface Variant {
  id: string;
  sku: string;
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

export default function StockMovementForm({ variants }: { variants: Variant[] }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  const [type, setType] = useState<string>("ADJUSTMENT");
  const [adjustmentKind, setAdjustmentKind] = useState<string>("add");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId),
    [variants, selectedVariantId]
  );

  const currentStock = selectedVariant ? selectedVariant.stockQuantity : 0;

  const isAdding = useMemo(() => {
    if (type === "PURCHASE_IN" || type === "RETURN_IN") return true;
    if (type === "SALE_OUT") return false;
    return adjustmentKind === "add";
  }, [type, adjustmentKind]);

  const newStock = isAdding
    ? currentStock + (quantity || 0)
    : Math.max(0, currentStock - (quantity || 0));

  return (
    <form
      action={createStockMovement}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Layers size={16} className="text-volt" />
          <span>Informações da Movimentação</span>
        </div>

        <div className="space-y-4">
          {/* Selecionar Item */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Produto / Variação *
            </label>
            <select
              name="variantId"
              required
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              {variants.map((v) => {
                const attrs = v.attributeValues
                  .map((av) => av.attributeValue.value)
                  .join(" / ");
                const label = attrs
                  ? `${v.product.name} (${attrs}) - SKU: ${v.sku} [Estoque: ${v.stockQuantity}]`
                  : `${v.product.name} - SKU: ${v.sku} [Estoque: ${v.stockQuantity}]`;

                return (
                  <option key={v.id} value={v.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tipo de Movimentação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Tipo de Operação *
              </label>
              <select
                name="type"
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="ADJUSTMENT">Ajuste Manual / Avaria / Contagem</option>
                <option value="PURCHASE_IN">Entrada por Compra / Reposição</option>
                <option value="SALE_OUT">Saída Avulsa / Venda Direta</option>
                <option value="RETURN_IN">Devolução de Cliente</option>
              </select>
            </div>

            {type === "ADJUSTMENT" && (
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">
                  Direção do Ajuste
                </label>
                <select
                  name="adjustmentKind"
                  value={adjustmentKind}
                  onChange={(e) => setAdjustmentKind(e.target.value)}
                  className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
                >
                  <option value="add">Entrada (+) - Adicionar ao estoque</option>
                  <option value="remove">Saída (-) - Perda, quebra ou avaria</option>
                </select>
              </div>
            )}
          </div>

          {/* Quantidade & Previsão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Quantidade *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            {/* Impacto no estoque */}
            <div className="flex items-center justify-between p-3 rounded-sm border border-base-line bg-base text-xs text-ink">
              <div>
                <span className="text-ink-soft block">Estoque atual:</span>
                <span className="font-semibold text-ink">{currentStock} un.</span>
              </div>

              <div className="text-center">
                <span className="text-ink-soft block">Operação:</span>
                <span className={`font-semibold ${isAdding ? "text-volt" : "text-alert"}`}>
                  {isAdding ? `+${quantity || 0}` : `-${quantity || 0}`}
                </span>
              </div>

              <div className="text-right">
                <span className="text-ink-soft block">Novo estoque:</span>
                <span className="font-semibold text-volt text-sm">
                  {newStock} un.
                </span>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Motivo / Justificativa *
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="Ex: Peça danificada no transporte, recontagem de inventário, reposição..."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/estoque"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para estoque
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando movimentação..." : "Registrar Movimentação"}
        </button>
      </div>
    </form>
  );
}
