"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { createProduct } from "@/lib/actions";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import ProductDetailsEditor from "@/components/admin/ProductDetailsEditor";

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface VariantRow {
  id: string;
  sku: string;
  costPrice: string;
  sellPrice: string;
  stockQuantity: string;
  minStockAlert: string;
}

export default function ProductForm({
  categories,
  suppliers,
}: {
  categories: Category[];
  suppliers: Supplier[];
}) {
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      id: "1",
      sku: "",
      costPrice: "",
      sellPrice: "",
      stockQuantity: "0",
      minStockAlert: "5",
    },
  ]);
  const [loading, setLoading] = useState(false);

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sku: "",
        costPrice: prev[0]?.costPrice || "",
        sellPrice: prev[0]?.sellPrice || "",
        stockQuantity: "0",
        minStockAlert: "5",
      },
    ]);
  }

  function removeVariant(id: string) {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVariant(id: string, field: keyof VariantRow, value: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setLoading(true);
    // Standard form submission handles formData via action or direct submit
  }

  return (
    <form
      action={createProduct}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-8"
    >
      {/* Informações Básicas */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
        <h2 className="text-base font-medium text-ink">Informações Principais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Nome do produto *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Legging Alta Compressão"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink-soft">
                Categoria *
              </label>
              <Link
                href="/admin/produtos/categorias/nova"
                target="_blank"
                className="text-[11px] text-volt hover:underline"
              >
                + Nova categoria
              </Link>
            </div>
            <select
              name="categoryId"
              required
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Marca
            </label>
            <input
              type="text"
              name="brand"
              placeholder="Ex: IzaFit"
              defaultValue="IzaFit"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Fornecedor (opcional)
            </label>
            <select
              name="supplierId"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Nenhum fornecedor vinculado</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Descrição
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detalhes sobre tecido, medidas, benefícios..."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Fotos do produto */}
      <ProductImageUpload />

      {/* Características & Detalhes */}
      <ProductDetailsEditor />

      {/* Variações de Estoque & Preço */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-ink">Variações & Estoque</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Cada variante vendável (ex: P/Preto, M/Preto ou 900g/Chocolate).
            </p>
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
          >
            <Plus size={14} className="text-volt" />
            Adicionar variação
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="pb-2 font-normal">SKU / Identificador *</th>
                <th className="pb-2 font-normal">Preço Custo (R$) *</th>
                <th className="pb-2 font-normal">Preço Venda (R$) *</th>
                <th className="pb-2 font-normal">Estoque Inicial</th>
                <th className="pb-2 font-normal">Alerta Mínimo</th>
                <th className="pb-2 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-line/60">
              {variants.map((v, index) => (
                <tr key={v.id}>
                  <td className="py-2.5 pr-2">
                    <input
                      type="text"
                      name="sku"
                      required
                      placeholder={`Ex: PROD-${index + 1}-M`}
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                      className="w-full rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      name="costPrice"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={v.costPrice}
                      onChange={(e) => updateVariant(v.id, "costPrice", e.target.value)}
                      className="w-28 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      name="sellPrice"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={v.sellPrice}
                      onChange={(e) => updateVariant(v.id, "sellPrice", e.target.value)}
                      className="w-28 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      name="stockQuantity"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) => updateVariant(v.id, "stockQuantity", e.target.value)}
                      className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 pr-2">
                    <input
                      type="number"
                      name="minStockAlert"
                      min="1"
                      value={v.minStockAlert}
                      onChange={(e) => updateVariant(v.id, "minStockAlert", e.target.value)}
                      className="w-20 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      disabled={variants.length <= 1}
                      className="text-ink-soft hover:text-alert disabled:opacity-30 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/produtos"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para produtos
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando produto..." : "Salvar Produto"}
        </button>
      </div>
    </form>
  );
}
