"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, Shirt, Package, Sparkles, Check, Image as ImageIcon } from "lucide-react";
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

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  photoPreview?: string | null;
}

interface CustomVariantRow {
  id: string;
  name: string;
  sku: string;
  costPrice: string;
  sellPrice: string;
  stockQuantity: string;
  minStockAlert: string;
}

const COMMON_SIZES = ["PP", "P", "M", "G", "GG", "XGG", "Único"];
const PRESET_COLORS = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Rosa Pink", hex: "#FF1493" },
  { name: "Rosa Claro", hex: "#FFB6C1" },
  { name: "Azul Marinho", hex: "#000080" },
  { name: "Azul Royal", hex: "#4169E1" },
  { name: "Verde Militar", hex: "#4B5320" },
  { name: "Cinza Mescla", hex: "#808080" },
  { name: "Vinho / Bordô", hex: "#800020" },
  { name: "Nude", hex: "#E3BC9A" },
];

export default function ProductForm({
  categories,
  suppliers,
}: {
  categories: Category[];
  suppliers: Supplier[];
}) {
  const [productName, setProductName] = useState("");
  const [mode, setMode] = useState<"clothing" | "custom">("clothing");
  const [loading, setLoading] = useState(false);

  // --- MODO ROUPAS: CORES & FOTOS ---
  const [colors, setColors] = useState<ColorItem[]>([
    { id: "c1", name: "Preto", hex: "#000000", photoPreview: null },
  ]);

  // --- MODO ROUPAS: TAMANHOS ---
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["P", "M", "G"]);
  const [customSizeInput, setCustomSizeInput] = useState("");

  // --- MODO ROUPAS: PREÇOS BASE ---
  const [baseCostPrice, setBaseCostPrice] = useState("");
  const [baseSellPrice, setBaseSellPrice] = useState("");

  // --- MODO ROUPAS: GRADE DE ESTOQUE (por Cor x Tamanho) ---
  // Mapa de chave "colorId_size" -> { stock: string, sku: string, sellPrice: string, costPrice: string }
  const [gridData, setGridData] = useState<
    Record<
      string,
      { stock: string; sku: string; sellPrice?: string; costPrice?: string }
    >
  >({});

  // --- MODO AVULSO: VARIAÇÕES SIMPLES (Suplementos, Acessórios) ---
  const [customVariants, setCustomVariants] = useState<CustomVariantRow[]>([
    {
      id: "1",
      name: "Tamanho Único",
      sku: "",
      costPrice: "",
      sellPrice: "",
      stockQuantity: "0",
      minStockAlert: "5",
    },
  ]);

  // Manipulação de cores
  function addColor(name = "", hex = "#000000") {
    const newId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setColors((prev) => [...prev, { id: newId, name, hex, photoPreview: null }]);
  }

  function removeColor(id: string) {
    if (colors.length <= 1) return;
    setColors((prev) => prev.filter((c) => c.id !== id));
  }

  function updateColor(id: string, field: "name" | "hex" | "photoPreview", value: string | null) {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  // Manipulação de tamanhos
  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function addCustomSize() {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
  }

  // Atualiza dado individual da grade
  function updateGrid(colorId: string, size: string, field: "stock" | "sku" | "sellPrice" | "costPrice", val: string) {
    const key = `${colorId}_${size}`;
    setGridData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        stock: field === "stock" ? val : prev[key]?.stock || "0",
        sku: field === "sku" ? val : prev[key]?.sku || "",
        sellPrice: field === "sellPrice" ? val : prev[key]?.sellPrice,
        costPrice: field === "costPrice" ? val : prev[key]?.costPrice,
      },
    }));
  }

  // Gera sugestão de SKU
  function getSuggestedSku(colorName: string, size: string) {
    const cleanProd = productName
      ? productName
          .substring(0, 4)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
      : "PROD";
    const cleanColor = colorName
      ? colorName
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
      : "COR";
    const cleanSize = size.replace(/[^A-Z0-9]/g, "");
    return `${cleanProd}-${cleanColor}-${cleanSize}`;
  }

  // Variações personalizadas (modo custom)
  function addCustomVariant() {
    setCustomVariants((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "",
        sku: "",
        costPrice: prev[0]?.costPrice || "",
        sellPrice: prev[0]?.sellPrice || "",
        stockQuantity: "0",
        minStockAlert: "5",
      },
    ]);
  }

  function removeCustomVariant(id: string) {
    if (customVariants.length <= 1) return;
    setCustomVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function updateCustomVariant(id: string, field: keyof CustomVariantRow, val: string) {
    setCustomVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  }

  return (
    <form
      action={createProduct}
      onSubmit={() => setLoading(true)}
      encType="multipart/form-data"
      className="space-y-8"
    >
      {/* Informações Principais */}
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
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Legging Alta Compressão, Top Nadador..."
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
              placeholder="Detalhes sobre o tecido, caimento, benefícios e uso..."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Fotos Gerais do Produto */}
      <ProductImageUpload />

      {/* Características & Detalhes */}
      <ProductDetailsEditor />

      {/* Tipo de Variação / Modo */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-6">
        <div>
          <h2 className="text-base font-medium text-ink">Cores, Tamanhos & Estoque</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Configure as cores com suas fotos e selecione os tamanhos disponíveis.
          </p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setMode("clothing")}
              className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition-all ${
                mode === "clothing"
                  ? "border-volt bg-volt/10 text-volt shadow-[0_0_0_1px_rgba(200,255,77,0.3)]"
                  : "border-base-line bg-base text-ink-soft hover:border-volt/50 hover:text-ink"
              }`}
            >
              <Shirt size={16} />
              <span>Roupas & Moda (Cores + Tamanhos + Fotos)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium transition-all ${
                mode === "custom"
                  ? "border-volt bg-volt/10 text-volt shadow-[0_0_0_1px_rgba(200,255,77,0.3)]"
                  : "border-base-line bg-base text-ink-soft hover:border-volt/50 hover:text-ink"
              }`}
            >
              <Package size={16} />
              <span>Suplementos / Acessórios (Variações Livres)</span>
            </button>
          </div>
        </div>

        {/* ==================== MODO 1: ROUPAS & MODA ==================== */}
        {mode === "clothing" && (
          <div className="space-y-8 pt-2">
            {/* 1. SEÇÃO DE CORES & FOTOS */}
            <div className="space-y-3 rounded-lg border border-base-line/80 bg-base/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-[11px] font-bold text-base">
                      1
                    </span>
                    Cores da Roupa & Fotos Específicas
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Adicione as cores da peça e suba a foto de cada cor (a foto muda automaticamente quando o cliente clica na cor).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => addColor()}
                  className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base-raised px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
                >
                  <Plus size={14} className="text-volt" />
                  + Adicionar Cor
                </button>
              </div>

              {/* Sugestões de Cores Rápidas */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-ink-soft mr-1">Sugestões:</span>
                {PRESET_COLORS.map((pc) => (
                  <button
                    key={pc.name}
                    type="button"
                    onClick={() => {
                      if (!colors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase())) {
                        addColor(pc.name, pc.hex);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-base-line bg-base px-2 py-0.5 text-[11px] text-ink-soft hover:border-volt/60 hover:text-ink transition-colors"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: pc.hex }}
                    />
                    <span>{pc.name}</span>
                  </button>
                ))}
              </div>

              {/* Lista de Cores Configuradas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {colors.map((c, cIdx) => (
                  <div
                    key={c.id}
                    className="relative flex items-center gap-3 rounded-md border border-base-line bg-base-raised p-3"
                  >
                    {/* Upload da Foto da Cor */}
                    <label className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-dashed border-base-line bg-base hover:border-volt transition-colors">
                      <input
                        type="file"
                        name={`colorImage_${cIdx}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateColor(c.id, "photoPreview", URL.createObjectURL(file));
                          }
                        }}
                      />
                      {c.photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.photoPreview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-1 text-center">
                          <ImageIcon size={16} className="text-ink-soft/40 mb-0.5" />
                          <span className="text-[9px] font-medium text-ink-soft leading-none">
                            + Foto Cor
                          </span>
                        </div>
                      )}
                    </label>

                    {/* Dados da Cor */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => updateColor(c.id, "hex", e.target.value)}
                          title="Escolher tom da cor"
                          className="h-7 w-7 rounded cursor-pointer border border-base-line bg-transparent p-0"
                        />
                        <input
                          type="text"
                          placeholder="Nome da cor (ex: Preto)"
                          value={c.name}
                          onChange={(e) => updateColor(c.id, "name", e.target.value)}
                          className="w-full rounded-sm border border-base-line bg-base px-2 py-1 text-xs text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-ink-soft">
                        Tom: <span className="font-mono text-ink">{c.hex}</span>
                      </p>
                    </div>

                    {/* Remover Cor */}
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(c.id)}
                        className="text-ink-soft/50 hover:text-alert transition-colors p-1"
                        title="Remover cor"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SEÇÃO DE TAMANHOS DISPONÍVEIS */}
            <div className="space-y-3 rounded-lg border border-base-line/80 bg-base/50 p-5">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-[11px] font-bold text-base">
                    2
                  </span>
                  Tamanhos Disponíveis
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Clique para ativar ou desativar os tamanhos que você vende para essa peça.
                </p>
              </div>

              {/* Chips de Tamanho */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {COMMON_SIZES.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`min-w-12 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-volt bg-volt/15 text-volt shadow-[0_0_0_1px_rgba(200,255,77,0.3)]"
                          : "border-base-line bg-base-raised text-ink-soft hover:border-volt/50 hover:text-ink"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}

                {/* Adicionar tamanho customizado */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Outro (ex: 38)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSize();
                      }
                    }}
                    className="w-24 rounded-sm border border-base-line bg-base px-2 py-1 text-xs text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomSize}
                    className="rounded-sm border border-base-line bg-base-raised px-2 py-1 text-xs text-ink hover:border-volt"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 3. PREÇOS BASE (Padrão) */}
            <div className="space-y-3 rounded-lg border border-base-line/80 bg-base/50 p-5">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-[11px] font-bold text-base">
                    3
                  </span>
                  Preços Padrão da Peça
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Estes valores serão aplicados a todos os tamanhos (você pode ajustar individualmente na grade abaixo se necessário).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Preço de Custo Padrão (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={baseCostPrice}
                    onChange={(e) => setBaseCostPrice(e.target.value)}
                    className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">
                    Preço de Venda Padrão (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={baseSellPrice}
                    onChange={(e) => setBaseSellPrice(e.target.value)}
                    className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none font-semibold text-volt"
                  />
                </div>
              </div>
            </div>

            {/* 4. GRADE GERADA DE ESTOQUE POR COR */}
            <div className="space-y-4 rounded-lg border border-base-line/80 bg-base/50 p-5">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-[11px] font-bold text-base">
                    4
                  </span>
                  Grade de Estoque por Cor & Tamanho
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Preencha o estoque disponível de cada tamanho para cada cor.
                </p>
              </div>

              {selectedSizes.length === 0 ? (
                <p className="text-xs text-alert py-2">
                  Selecione ao menos 1 tamanho no passo 2 acima para gerar a grade.
                </p>
              ) : (
                <div className="space-y-5">
                  {colors.map((c, cIdx) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-base-line bg-base-raised p-4"
                    >
                      {/* Cabeçalho da Cor */}
                      <div className="flex items-center gap-2.5 border-b border-base-line/60 pb-3 mb-3">
                        {c.photoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photoPreview}
                            alt=""
                            className="h-8 w-8 rounded object-cover border border-base-line"
                          />
                        ) : (
                          <span
                            className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                        )}
                        <div>
                          <span className="font-semibold text-ink text-sm">
                            {c.name || `Cor #${cIdx + 1}`}
                          </span>
                          <span className="text-[11px] text-ink-soft ml-2">
                            ({selectedSizes.length} tamanhos)
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Estoque dos Tamanhos desta Cor */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[500px]">
                          <thead>
                            <tr className="text-left text-ink-soft border-b border-base-line/40">
                              <th className="pb-1.5 font-normal w-20">Tamanho</th>
                              <th className="pb-1.5 font-normal">Estoque Inicial</th>
                              <th className="pb-1.5 font-normal">Preço Venda (R$)</th>
                              <th className="pb-1.5 font-normal">SKU</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-base-line/30">
                            {selectedSizes.map((sz) => {
                              const key = `${c.id}_${sz}`;
                              const cell = gridData[key];
                              const defaultSku = getSuggestedSku(c.name, sz);
                              const currentSku = cell?.sku !== undefined ? cell.sku : defaultSku;
                              const currentStock = cell?.stock || "0";
                              const currentSell = cell?.sellPrice || baseSellPrice || "";
                              const currentCost = cell?.costPrice || baseCostPrice || "";

                              return (
                                <tr key={sz} className="hover:bg-base/30">
                                  {/* Inputs Ocultos Submetidos ao Form */}
                                  <input type="hidden" name="variantColor" value={c.name || "Padrão"} />
                                  <input type="hidden" name="variantColorHex" value={c.hex} />
                                  <input type="hidden" name="variantSize" value={sz} />
                                  <input type="hidden" name="variantColorIndex" value={cIdx} />
                                  <input type="hidden" name="minStockAlert" value="5" />
                                  <input type="hidden" name="costPrice" value={currentCost || "0"} />

                                  <td className="py-2 font-bold text-ink">
                                    <span className="inline-block rounded bg-base px-2 py-1 border border-base-line">
                                      {sz}
                                    </span>
                                  </td>

                                  <td className="py-2 pr-3">
                                    <input
                                      type="number"
                                      name="stockQuantity"
                                      min="0"
                                      value={currentStock}
                                      onChange={(e) =>
                                        updateGrid(c.id, sz, "stock", e.target.value)
                                      }
                                      className="w-24 rounded-sm border border-base-line bg-base px-2 py-1 text-xs text-ink focus:border-volt focus:outline-none"
                                    />
                                  </td>

                                  <td className="py-2 pr-3">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      name="sellPrice"
                                      required
                                      value={currentSell}
                                      onChange={(e) =>
                                        updateGrid(c.id, sz, "sellPrice", e.target.value)
                                      }
                                      placeholder={baseSellPrice || "0.00"}
                                      className="w-24 rounded-sm border border-base-line bg-base px-2 py-1 text-xs text-ink focus:border-volt focus:outline-none font-medium text-volt"
                                    />
                                  </td>

                                  <td className="py-2">
                                    <input
                                      type="text"
                                      name="sku"
                                      required
                                      value={currentSku}
                                      onChange={(e) =>
                                        updateGrid(c.id, sz, "sku", e.target.value)
                                      }
                                      className="w-40 rounded-sm border border-base-line bg-base px-2 py-1 text-xs text-ink focus:border-volt focus:outline-none font-mono"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== MODO 2: PRODUTOS AVULSOS / SUPLEMENTOS ==================== */}
        {mode === "custom" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">Variações Avulsas do Produto</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Ideal para Suplementos (sabores/pesos), Acessórios ou itens sem cor e tamanho.
                </p>
              </div>

              <button
                type="button"
                onClick={addCustomVariant}
                className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
              >
                <Plus size={14} className="text-volt" />
                Adicionar Variação
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                    <th className="pb-2 font-normal">Nome da Variação *</th>
                    <th className="pb-2 font-normal">SKU *</th>
                    <th className="pb-2 font-normal">Custo (R$)</th>
                    <th className="pb-2 font-normal">Venda (R$) *</th>
                    <th className="pb-2 font-normal">Estoque</th>
                    <th className="pb-2 font-normal">Alerta</th>
                    <th className="pb-2 font-normal text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-line/60">
                  {customVariants.map((v, index) => (
                    <tr key={v.id}>
                      <input type="hidden" name="variantColor" value="" />
                      <input type="hidden" name="variantColorHex" value="" />
                      <input type="hidden" name="variantSize" value="" />
                      <input type="hidden" name="variantColorIndex" value="" />

                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          required
                          placeholder="Ex: 900g Baunilha, Kit 3 Faixas..."
                          value={v.name}
                          onChange={(e) => updateCustomVariant(v.id, "name", e.target.value)}
                          className="w-48 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="text"
                          name="sku"
                          required
                          placeholder={v.name ? `PROD-${index + 1}` : `SKU-${index + 1}`}
                          value={v.sku || (v.name ? `PROD-${index + 1}` : "")}
                          onChange={(e) => updateCustomVariant(v.id, "sku", e.target.value)}
                          className="w-32 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink focus:border-volt focus:outline-none font-mono"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="costPrice"
                          step="0.01"
                          min="0"
                          value={v.costPrice}
                          onChange={(e) => updateCustomVariant(v.id, "costPrice", e.target.value)}
                          placeholder="0.00"
                          className="w-24 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="sellPrice"
                          step="0.01"
                          min="0"
                          required
                          value={v.sellPrice}
                          onChange={(e) => updateCustomVariant(v.id, "sellPrice", e.target.value)}
                          placeholder="0.00"
                          className="w-24 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none font-medium text-volt"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="stockQuantity"
                          min="0"
                          value={v.stockQuantity}
                          onChange={(e) => updateCustomVariant(v.id, "stockQuantity", e.target.value)}
                          className="w-20 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 pr-2">
                        <input
                          type="number"
                          name="minStockAlert"
                          min="1"
                          value={v.minStockAlert}
                          onChange={(e) => updateCustomVariant(v.id, "minStockAlert", e.target.value)}
                          className="w-16 rounded-sm border border-base-line bg-base px-2 py-1.5 text-xs text-ink focus:border-volt focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeCustomVariant(v.id)}
                          disabled={customVariants.length <= 1}
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
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-semibold hover:bg-volt-dim disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? "Salvando produto..." : "Salvar Produto"}
        </button>
      </div>
    </form>
  );
}
