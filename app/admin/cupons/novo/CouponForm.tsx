"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { createCoupon } from "@/lib/actions";

export default function CouponForm() {
  const [type, setType] = useState<string>("PERCENTAGE");
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={createCoupon}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Tag size={16} className="text-volt" />
          <span>Configuração do Cupom</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Código do Cupom *
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="Ex: VERAO15"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Tipo de Desconto *
            </label>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="PERCENTAGE">Porcentagem (%)</option>
              <option value="FIXED">Valor Fixo (R$)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              {type === "PERCENTAGE" ? "Valor em % *" : "Valor em R$ *"}
            </label>
            <input
              type="number"
              name="value"
              step="0.01"
              min="0.01"
              required
              placeholder={type === "PERCENTAGE" ? "15" : "30.00"}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Valor Mínimo da Compra (R$)
            </label>
            <input
              type="number"
              name="minPurchase"
              step="0.01"
              min="0"
              placeholder="0.00 (Opcional)"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Limite Máximo de Usos
            </label>
            <input
              type="number"
              name="maxUses"
              min="1"
              placeholder="Ilimitado se vazio"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Data de Validade (Opcional)
            </label>
            <input
              type="date"
              name="validUntil"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/cupons"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para cupons
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Criando cupom..." : "Criar Cupom"}
        </button>
      </div>
    </form>
  );
}
