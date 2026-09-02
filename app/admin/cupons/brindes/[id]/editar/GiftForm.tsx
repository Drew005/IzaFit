"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { updateGift } from "@/lib/actions";

export default function GiftForm({
  gift,
  products = [],
  categories = [],
}: {
  gift: {
    id: string;
    name: string;
    description?: string | null;
    stockQuantity: number;
    minPurchaseValue?: any;
    minLoyaltyPoints?: number | null;
    productId?: string | null;
    categoryId?: string | null;
    active: boolean;
  };
  products?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}) {
  const [loading, setLoading] = useState(false);

  const boundUpdate = updateGift.bind(null, gift.id);

  return (
    <form
      action={boundUpdate}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Gift size={16} className="text-volt" />
          <span>Informações do Brinde</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Nome do Brinde *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={gift.name}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Estoque *
            </label>
            <input
              type="number"
              name="stockQuantity"
              defaultValue={gift.stockQuantity}
              min="0"
              required
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Status
            </label>
            <select
              name="active"
              defaultValue={String(gift.active)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Vincular a Produto (Opcional)
            </label>
            <select
              name="productId"
              defaultValue={gift.productId ?? ""}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Nenhum</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Vincular a Categoria (Opcional)
            </label>
            <select
              name="categoryId"
              defaultValue={gift.categoryId ?? ""}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Nenhuma</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Valor Mínimo de Compra para Ganhar (R$)
            </label>
            <input
              type="number"
              name="minPurchaseValue"
              step="0.01"
              min="0"
              defaultValue={gift.minPurchaseValue ?? ""}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Pontos de Fidelidade para Resgate
            </label>
            <input
              type="number"
              name="minLoyaltyPoints"
              min="1"
              defaultValue={gift.minLoyaltyPoints ?? ""}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Descrição / Condições
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={gift.description ?? ""}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
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
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
