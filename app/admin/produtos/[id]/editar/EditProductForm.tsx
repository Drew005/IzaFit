"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import { updateProduct, deleteProduct } from "@/lib/actions";
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

interface Variant {
  id: string;
  sku: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  costPrice: any;
  sellPrice: any;
  stockQuantity: number;
  minStockAlert: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  brand: string | null;
  supplierId: string | null;
  imageUrl?: string | null;
  images?: string[];
  details?: unknown;
  active: boolean;
  variants: Variant[];
}

interface NewVariantRow {
  tempId: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  costPrice: string;
  sellPrice: string;
  stockQuantity: string;
  minStockAlert: string;
}

export default function EditProductForm({
  product,
  categories,
  suppliers,
}: {
  product: Product;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const [active, setActive] = useState(product.active);
  const [variants, setVariants] = useState<Variant[]>(product.variants);
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [newVariants, setNewVariants] = useState<NewVariantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateProductWithId = updateProduct.bind(null, product.id);

  function addNewVariant() {
    const lastVar = variants[variants.length - 1];
    setNewVariants((prev) => [
      ...prev,
      {
        tempId: String(Date.now()),
        sku: "",
        color: lastVar?.color || "",
        colorHex: lastVar?.colorHex || "#000000",
        size: "",
        costPrice: String(variants[0]?.costPrice ?? ""),
        sellPrice: String(variants[0]?.sellPrice ?? ""),
        stockQuantity: "0",
        minStockAlert: "5",
      },
    ]);
  }

  function removeNewVariant(tempId: string) {
    if (variants.length + newVariants.length <= 1) {
      alert("O produto deve possuir pelo menos uma variação.");
      return;
    }
    setNewVariants((prev) => prev.filter((v) => v.tempId !== tempId));
  }

  function removeExistingVariant(id: string) {
    if (variants.length + newVariants.length <= 1) {
      alert("O produto deve possuir pelo menos uma variação.");
      return;
    }
    const confirm = window.confirm(
      "Tem certeza que deseja remover esta variação? Caso ela possua histórico de vendas ou compras, ela será desativada para preservar os registros."
    );
    if (!confirm) return;

    setVariants((prev) => prev.filter((v) => v.id !== id));
    setRemovedVariantIds((prev) => [...prev, id]);
  }

  function updateExistingVariant(id: string, field: keyof Variant, value: any) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  function updateNewVariantField(
    tempId: string,
    field: keyof NewVariantRow,
    value: string
  ) {
    setNewVariants((prev) =>
      prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v))
    );
  }

  async function handleDelete() {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir produto.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateProductWithId}
        onSubmit={() => setLoading(true)}
        encType="multipart/form-data"
        className="space-y-8"
      >
        {/* Informações Principais */}
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-ink">
              Informações Principais
            </h2>
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
                className="rounded border-base-line bg-base text-volt focus:ring-0 focus:ring-offset-0"
              />
              <span>Produto Ativo no Catálogo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Nome do produto *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={product.name}
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
                defaultValue={product.categoryId}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
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
                defaultValue={product.brand || ""}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Fornecedor
              </label>
              <select
                name="supplierId"
                defaultValue={product.supplierId || ""}
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
                defaultValue={product.description || ""}
                placeholder="Detalhes sobre medidas, tecido, benefícios..."
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Fotos do produto */}
        <ProductImageUpload
          existing={[product.imageUrl, ...(product.images ?? [])].filter(
            (url): url is string => Boolean(url)
          )}
        />

        {/* Características & Detalhes */}
        <ProductDetailsEditor value={product.details} />

        {/* Variações Existentes */}
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          {removedVariantIds.map((id) => (
            <input key={id} type="hidden" name="removedVariantId" value={id} />
          ))}
          <div>
            <h2 className="text-base font-medium text-ink">
              Variações, Cores & Fotos Cadastradas
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Edite as cores, tamanhos, fotos individuais, preços e estoque das variações existentes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[850px]">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                  <th className="pb-2 font-normal">Foto da Cor</th>
                  <th className="pb-2 font-normal">Cor & Amostra</th>
                  <th className="pb-2 font-normal">Tam.</th>
                  <th className="pb-2 font-normal">SKU *</th>
                  <th className="pb-2 font-normal">Custo (R$)</th>
                  <th className="pb-2 font-normal">Venda (R$)</th>
                  <th className="pb-2 font-normal">Estoque</th>
                  <th className="pb-2 font-normal">Alerta</th>
                  <th className="pb-2 font-normal text-center">Ativa?</th>
                  <th className="pb-2 font-normal text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-line/60">
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-4 text-center text-xs text-ink-soft italic">
                      Nenhuma variação salva restante. Adicione novas variações abaixo antes de salvar.
                    </td>
                  </tr>
                ) : (
                  variants.map((v) => (
                    <tr key={v.id}>
                      {/* Foto da Variação */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="hidden"
                          name="variantImageUrl"
                          value={v.imageUrl || ""}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            name={`variantImage_${v.id}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const previewEl = document.getElementById(`edit-preview-${v.id}`) as HTMLImageElement | null;
                                if (previewEl) {
                                  previewEl.src = URL.createObjectURL(file);
                                  previewEl.classList.remove("hidden");
                                }
                              }
                            }}
                          />
                          <div className="h-9 w-9 shrink-0 rounded border border-dashed border-base-line bg-base grid place-items-center overflow-hidden hover:border-volt/60 transition-colors">
                            {v.imageUrl ? (
                              <img
                                id={`edit-preview-${v.id}`}
                                src={v.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <>
                                <img
                                  id={`edit-preview-${v.id}`}
                                  alt=""
                                  className="h-full w-full object-cover hidden"
                                />
                                <span className="text-[10px] text-ink-soft select-none pointer-events-none text-center leading-tight">
                                  + Foto
                                </span>
                              </>
                            )}
                          </div>
                        </label>
                      </td>

                      {/* Cor e Hexadecimal */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            name="variantColorHex"
                            value={v.colorHex || "#000000"}
                            onChange={(e) =>
                              updateExistingVariant(v.id, "colorHex", e.target.value)
                            }
                            title="Escolher tom da cor"
                            className="h-7 w-7 rounded cursor-pointer border border-base-line bg-transparent p-0"
                          />
                          <input
                            type="text"
                            name="variantColor"
                            placeholder="Ex: Preto, Rosa..."
                            value={v.color || ""}
                            onChange={(e) =>
                              updateExistingVariant(v.id, "color", e.target.value)
                            }
                            className="w-28 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Tamanho */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          name="variantSize"
                          placeholder="P, M, G..."
                          value={v.size || ""}
                          onChange={(e) =>
                            updateExistingVariant(v.id, "size", e.target.value)
                          }
                          className="w-16 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 pr-2">
                        <input type="hidden" name="variantId" value={v.id} />
                        <input
                          type="text"
                          name="variantSku"
                          required
                          value={v.sku}
                          onChange={(e) =>
                            updateExistingVariant(v.id, "sku", e.target.value)
                          }
                          className="w-28 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Custo */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="variantCostPrice"
                          step="0.01"
                          min="0"
                          required
                          value={Number(v.costPrice)}
                          onChange={(e) =>
                            updateExistingVariant(
                              v.id,
                              "costPrice",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Venda */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="variantSellPrice"
                          step="0.01"
                          min="0"
                          required
                          value={Number(v.sellPrice)}
                          onChange={(e) =>
                            updateExistingVariant(
                              v.id,
                              "sellPrice",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Estoque */}
                      <td className="py-2.5 pr-2">
                        <span className="inline-block px-2 py-1.5 text-xs text-ink bg-base rounded-sm border border-base-line/50">
                          {v.stockQuantity} un.
                        </span>
                      </td>

                      {/* Alerta */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="variantMinStockAlert"
                          min="1"
                          value={v.minStockAlert}
                          onChange={(e) =>
                            updateExistingVariant(
                              v.id,
                              "minStockAlert",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-16 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Status */}
                      <td className="py-2.5 text-center">
                        <input
                          type="hidden"
                          name="variantActive"
                          value={v.active ? "true" : "false"}
                        />
                        <input
                          type="checkbox"
                          checked={v.active}
                          onChange={(e) =>
                            updateExistingVariant(v.id, "active", e.target.checked)
                          }
                          className="rounded border-base-line bg-base text-volt focus:ring-0"
                        />
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeExistingVariant(v.id)}
                          disabled={variants.length + newVariants.length <= 1}
                          title="Remover variação"
                          className="text-ink-soft hover:text-alert disabled:opacity-30 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adicionar Novas Variações */}
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-ink">
                Novas Variações
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Adicione tamanhos, cores ou novas apresentações para este
                produto.
              </p>
            </div>

            <button
              type="button"
              onClick={addNewVariant}
              className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
            >
              <Plus size={14} className="text-volt" />
              Adicionar nova variação
            </button>
          </div>

          {newVariants.length === 0 ? (
            <p className="text-xs text-ink-soft italic py-2">
              Nenhuma variação adicional sendo adicionada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                    <th className="pb-2 font-normal">Foto da Cor</th>
                    <th className="pb-2 font-normal">Cor & Amostra</th>
                    <th className="pb-2 font-normal">Tam.</th>
                    <th className="pb-2 font-normal">SKU *</th>
                    <th className="pb-2 font-normal">Custo (R$)</th>
                    <th className="pb-2 font-normal">Venda (R$)</th>
                    <th className="pb-2 font-normal">Estoque</th>
                    <th className="pb-2 font-normal">Alerta</th>
                    <th className="pb-2 font-normal text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-line/60">
                  {newVariants.map((nv) => (
                    <tr key={nv.tempId}>
                      <input type="hidden" name="newTempId" value={nv.tempId} />
                      {/* Foto da Nova Variação */}
                      <td className="py-2.5 pr-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            name={`newVariantImage_${nv.tempId}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const previewEl = document.getElementById(`new-preview-${nv.tempId}`) as HTMLImageElement | null;
                                if (previewEl) {
                                  previewEl.src = URL.createObjectURL(file);
                                  previewEl.classList.remove("hidden");
                                }
                              }
                            }}
                          />
                          <div className="h-9 w-9 shrink-0 rounded border border-dashed border-base-line bg-base grid place-items-center overflow-hidden hover:border-volt/60 transition-colors">
                            <img
                              id={`new-preview-${nv.tempId}`}
                              alt=""
                              className="h-full w-full object-cover hidden"
                            />
                            <span className="text-[10px] text-ink-soft select-none pointer-events-none text-center leading-tight">
                              + Foto
                            </span>
                          </div>
                        </label>
                      </td>

                      {/* Cor e Hexadecimal */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            name="newColorHex"
                            value={nv.colorHex || "#000000"}
                            onChange={(e) =>
                              updateNewVariantField(nv.tempId, "colorHex", e.target.value)
                            }
                            title="Escolher tom da cor"
                            className="h-7 w-7 rounded cursor-pointer border border-base-line bg-transparent p-0"
                          />
                          <input
                            type="text"
                            name="newColor"
                            placeholder="Ex: Preto, Rosa..."
                            value={nv.color || ""}
                            onChange={(e) =>
                              updateNewVariantField(nv.tempId, "color", e.target.value)
                            }
                            className="w-28 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Tamanho */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          name="newSize"
                          placeholder="P, M, G..."
                          value={nv.size || ""}
                          onChange={(e) =>
                            updateNewVariantField(nv.tempId, "size", e.target.value)
                          }
                          className="w-16 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          name="newSku"
                          required
                          placeholder="Ex: PROD-NOVO-G"
                          value={nv.sku}
                          onChange={(e) =>
                            updateNewVariantField(
                              nv.tempId,
                              "sku",
                              e.target.value
                            )
                          }
                          className="w-28 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Custo */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="newCostPrice"
                          step="0.01"
                          min="0"
                          required
                          value={nv.costPrice}
                          onChange={(e) =>
                            updateNewVariantField(
                              nv.tempId,
                              "costPrice",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Venda */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="newSellPrice"
                          step="0.01"
                          min="0"
                          required
                          value={nv.sellPrice}
                          onChange={(e) =>
                            updateNewVariantField(
                              nv.tempId,
                              "sellPrice",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Estoque */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="newStockQuantity"
                          min="0"
                          value={nv.stockQuantity}
                          onChange={(e) =>
                            updateNewVariantField(
                              nv.tempId,
                              "stockQuantity",
                              e.target.value
                            )
                          }
                          className="w-20 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Alerta */}
                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="newMinStockAlert"
                          min="1"
                          value={nv.minStockAlert}
                          onChange={(e) =>
                            updateNewVariantField(
                              nv.tempId,
                              "minStockAlert",
                              e.target.value
                            )
                          }
                          className="w-16 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeNewVariant(nv.tempId)}
                          disabled={variants.length + newVariants.length <= 1}
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
          )}
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
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Zona de Perigo / Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir produto
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação excluirá o produto e todas as variações vinculadas a ele.
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
