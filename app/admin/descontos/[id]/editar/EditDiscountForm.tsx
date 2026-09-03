"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Trash2, AlertTriangle } from "lucide-react";
import { updateDiscount, deleteDiscount } from "@/lib/actions";
import type { DiscountTarget } from "../../novo/DiscountForm";

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

interface Discount {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: any;
  productId: string | null;
  categoryId: string | null;
  variantId: string | null;
  validUntil: Date | null;
  active: boolean;
}

export default function EditDiscountForm({
  discount,
  products,
  categories,
  variants,
}: {
  discount: Discount;
  products: Product[];
  categories: Category[];
  variants: Variant[];
}) {
  const [type, setType] = useState<string>(discount.type);
  const [target, setTarget] = useState<DiscountTarget>(
    discount.categoryId ? "category" : discount.productId ? "product" : "variant"
  );
  const [active, setActive] = useState<boolean>(discount.active);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateDiscountWithId = updateDiscount.bind(null, discount.id);

  const defaultDate = discount.validUntil
    ? new Date(discount.validUntil).toISOString().split("T")[0]
    : "";

  async function handleDelete() {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir este desconto? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteDiscount(discount.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir desconto.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateDiscountWithId}
        onSubmit={() => setLoading(true)}
        className="space-y-6"
      >
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <BadgePercent size={16} className="text-volt" />
              <span>Configuração do Desconto</span>
            </div>

            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="hidden"
                name="active"
                value={active ? "true" : "false"}
              />
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-base-line bg-base text-volt focus:ring-0"
              />
              <span>Desconto Ativo</span>
            </label>
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
                defaultValue={discount.name}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
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

            {target === "category" && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink-soft mb-1.5">
                  Categoria *
                </label>
                <select
                  name="categoryId"
                  defaultValue={discount.categoryId ?? ""}
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
                  defaultValue={discount.productId ?? ""}
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
                  defaultValue={discount.variantId ?? ""}
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
                defaultValue={Number(discount.value)}
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
                defaultValue={defaultDate}
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
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir desconto
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação excluirá permanentemente o desconto do sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-alert/40 text-alert text-xs font-medium hover:bg-alert hover:text-base transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
        </button>
      </div>
    </div>
  );
}
