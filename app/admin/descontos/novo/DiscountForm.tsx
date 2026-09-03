"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgePercent } from "lucide-react";
import { createDiscount } from "@/lib/actions";

export type DiscountTarget = "product" | "category" | "variant";

interface Product {
  id: string;
  name: string;
}
interface Category {
  id: string;
  name: string;
}
interface Variant {
  id: string;
  sku: string;
  product: { id: string; name: string };
}

export default function DiscountForm({
  products,
  categories,
  variants,
}: {
  products: Product[];
  categories: Category[];
  variants: Variant[];
}) {
  const [type, setType] = useState<string>("PERCENTAGE");
  const [target, setTarget] = useState<DiscountTarget>("category");
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={createDiscount}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <BadgePercent size={16} className="text-volt" />
          <span>Configuração do Desconto</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Nome do Desconto *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Promoção de Verão - Leggings"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Onde aplicar *
            </label>
            <select
              name="target"
              value={target}
              onChange={(e) => setTarget(e.target.value as DiscountTarget)}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="category">Categoria</option>
              <option value="product">Produto específico</option>
              <option value="variant">Variação específica</option>
            </select>
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

          {/* Selectores dinâmicos conforme o alvo */}
          {target === "category" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Categoria *
              </label>
              <select
                name="categoryId"
                required
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="">Selecione a categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === "product" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Produto *
              </label>
              <select
                name="productId"
                required
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="">Selecione o produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === "variant" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Variação *
              </label>
              <select
                name="variantId"
                required
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="">Selecione a variação...</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product.name} — {v.sku}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Data de Validade
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
          href="/admin/descontos"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para descontos
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Criando desconto..." : "Criar Desconto"}
        </button>
      </div>
    </form>
  );
}
