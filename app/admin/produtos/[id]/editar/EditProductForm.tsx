"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { updateProduct, deleteProduct } from "@/lib/actions";
import ProductImageUpload from "@/components/admin/ProductImageUpload";
import ProductDetailsEditor from "@/components/admin/ProductDetailsEditor";

type Category = { id: string; name: string };
type Supplier = { id: string; name: string };
type Variant = {
  id: string; sku: string; color?: string | null; colorHex?: string | null;
  size?: string | null; imageUrl?: string | null; costPrice: unknown;
  sellPrice: unknown; stockQuantity: number; minStockAlert: number; active: boolean;
};
type Product = {
  id: string; name: string; description: string | null; categoryId: string;
  brand: string | null; supplierId: string | null; imageUrl?: string | null;
  images?: string[]; details?: unknown; active: boolean; variants: Variant[];
};
type Color = { name: string; hex: string; index: number };
type Cell = { variantId?: string; sku: string; cost: string; sell: string; stock: string; alert: string; active: boolean };

const sizesDefault = ["PP", "P", "M", "G", "GG", "XG", "Único"];

export default function EditProductForm({ product, categories, suppliers }: {
  product: Product; categories: Category[]; suppliers: Supplier[];
}) {
  const initialColors = useMemo<Color[]>(() => {
    const map = new Map<string, Color>();
    product.variants.forEach((v, index) => {
      const name = v.color?.trim() || "Padrão";
      if (!map.has(name)) map.set(name, { name, hex: v.colorHex || "#777777", index: map.size });
    });
    return [...map.values()];
  }, [product.variants]);
  const initialSizes = useMemo(() => {
    const values = product.variants.map((v) => v.size?.trim()).filter(Boolean) as string[];
    return [...new Set(values.length ? values : ["Único"])];
  }, [product.variants]);
  const [colors, setColors] = useState(initialColors.length ? initialColors : [{ name: "Padrão", hex: "#777777", index: 0 }]);
  const [sizes, setSizes] = useState(initialSizes);
  const [active, setActive] = useState(product.active);
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [cells, setCells] = useState<Record<string, Cell>>(() => {
    const result: Record<string, Cell> = {};
    product.variants.forEach((v) => {
      const color = v.color?.trim() || "Padrão";
      const size = v.size?.trim() || "Único";
      result[`${color}__${size}`] = {
        variantId: v.id, sku: v.sku, cost: String(v.costPrice), sell: String(v.sellPrice),
        stock: String(v.stockQuantity), alert: String(v.minStockAlert), active: v.active,
      };
    });
    return result;
  });

  const updateCell = (key: string, patch: Partial<Cell>) => setCells((old) => ({ ...old, [key]: { ...old[key], ...patch } }));
  const addSize = () => { const value = newSize.trim().toUpperCase(); if (value && !sizes.includes(value)) setSizes((s) => [...s, value]); setNewSize(""); };
  const addColor = () => { const value = newColor.trim(); if (value && !colors.some((c) => c.name.toLowerCase() === value.toLowerCase())) setColors((c) => [...c, { name: value, hex: "#777777", index: c.length }]); setNewColor(""); };
  const removeVariant = (id: string) => { if (window.confirm("Remover esta variação?")) setRemoved((r) => [...r, id]); };

  return (
    <form action={updateProduct.bind(null, product.id)} onSubmit={() => setLoading(true)} encType="multipart/form-data" className="space-y-8">
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      {removed.map((id) => <input key={id} type="hidden" name="removedVariantId" value={id} />)}
      <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="text-base font-medium text-ink">Informações principais</h2><label className="text-xs text-ink"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mr-2" />Produto ativo</label></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-ink-soft">Nome *<input name="name" required defaultValue={product.name} className="mt-1 w-full rounded border border-base-line bg-base px-3 py-2 text-sm text-ink" /></label>
          <label className="text-xs text-ink-soft">Categoria *<select name="categoryId" required defaultValue={product.categoryId} className="mt-1 w-full rounded border border-base-line bg-base px-3 py-2 text-sm text-ink">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-xs text-ink-soft">Marca<input name="brand" defaultValue={product.brand || ""} className="mt-1 w-full rounded border border-base-line bg-base px-3 py-2 text-sm text-ink" /></label>
          <label className="text-xs text-ink-soft">Fornecedor<select name="supplierId" defaultValue={product.supplierId || ""} className="mt-1 w-full rounded border border-base-line bg-base px-3 py-2 text-sm text-ink"><option value="">Nenhum</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="text-xs text-ink-soft md:col-span-2">Descrição<textarea name="description" defaultValue={product.description || ""} rows={3} className="mt-1 w-full rounded border border-base-line bg-base px-3 py-2 text-sm text-ink" /></label>
        </div>
      </section>
      <ProductImageUpload existing={[product.imageUrl, ...(product.images || [])].filter((x): x is string => Boolean(x))} />
      <ProductDetailsEditor value={product.details} />
      <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
        <div><h2 className="text-base font-medium text-ink">Cores, tamanhos e estoque</h2><p className="text-xs text-ink-soft">Cada combinação de cor e tamanho é uma variação vendável. As fotos da cor são compartilhadas entre seus tamanhos.</p></div>
        <div className="flex flex-wrap gap-2"><input value={newColor} onChange={(e) => setNewColor(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())} placeholder="Nova cor" className="rounded border border-base-line bg-base px-2 py-1.5 text-xs text-ink" /><button type="button" onClick={addColor} className="rounded border border-base-line px-3 py-1.5 text-xs text-ink"><Plus size={13} className="mr-1 inline text-volt" />Cor</button><input value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())} placeholder="Novo tamanho" className="rounded border border-base-line bg-base px-2 py-1.5 text-xs text-ink" /><button type="button" onClick={addSize} className="rounded border border-base-line px-3 py-1.5 text-xs text-ink"><Plus size={13} className="mr-1 inline text-volt" />Tamanho</button></div>
        <div className="space-y-6">
          {colors.map((color, colorIndex) => <div key={color.name} className="rounded border border-base-line p-4"><div className="mb-3 flex items-center gap-2"><input type="color" value={color.hex} onChange={(e) => setColors((all) => all.map((c) => c.name === color.name ? { ...c, hex: e.target.value } : c))} className="h-7 w-7" /><strong className="text-sm text-ink">{color.name}</strong><label className="ml-auto cursor-pointer text-xs text-ink-soft">Foto da cor<input type="file" name={`colorImage_${colorIndex}`} accept="image/*" className="ml-2 text-xs" /></label></div><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-xs"><thead><tr className="border-b border-base-line text-left text-ink-soft"><th className="pb-2">Tamanho</th><th>SKU</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Alerta</th><th>Ativa</th><th /></tr></thead><tbody>{sizes.map((size) => { const key = `${color.name}__${size}`; const cell = cells[key] || { sku: `${product.name.slice(0, 4).toUpperCase()}-${color.name.slice(0, 3).toUpperCase()}-${size}`, cost: "0", sell: "0", stock: "0", alert: "5", active: true }; const existing = product.variants.find((v) => v.id === cell.variantId); if (existing && removed.includes(existing.id)) return null; return <tr key={key} className="border-b border-base-line/40"><td className="py-2 font-medium text-ink">{size}<input type="hidden" name="variantId" value={cell.variantId || ""} /><input type="hidden" name="variantColor" value={color.name} /><input type="hidden" name="variantColorHex" value={color.hex} /><input type="hidden" name="variantSize" value={size} /><input type="hidden" name="variantColorIndex" value={colorIndex} /></td><td><input name="sku" required value={cell.sku} onChange={(e) => updateCell(key, { sku: e.target.value })} className="w-32 rounded border border-base-line bg-base px-2 py-1 text-ink" /></td><td><input name="costPrice" type="number" step=".01" value={cell.cost} onChange={(e) => updateCell(key, { cost: e.target.value })} className="w-20 rounded border border-base-line bg-base px-2 py-1 text-ink" /></td><td><input name="sellPrice" required type="number" step=".01" value={cell.sell} onChange={(e) => updateCell(key, { sell: e.target.value })} className="w-20 rounded border border-base-line bg-base px-2 py-1 text-ink" /></td><td><input name="stockQuantity" type="number" min="0" value={cell.stock} onChange={(e) => updateCell(key, { stock: e.target.value })} className="w-20 rounded border border-base-line bg-base px-2 py-1 text-ink" /></td><td><input name="minStockAlert" type="number" min="0" value={cell.alert} onChange={(e) => updateCell(key, { alert: e.target.value })} className="w-16 rounded border border-base-line bg-base px-2 py-1 text-ink" /></td><td><input type="hidden" name="variantActive" value={cell.active ? "true" : "false"} /><input type="checkbox" checked={cell.active} onChange={(e) => updateCell(key, { active: e.target.checked })} /></td><td>{cell.variantId && <button type="button" onClick={() => removeVariant(cell.variantId!)} className="text-ink-soft hover:text-alert"><Trash2 size={15} /></button>}</td></tr>; })}</tbody></table></div></div>)}
        </div>
      </section>
      <div className="flex items-center justify-between"><Link href="/admin/produtos" className="rounded border border-base-line px-4 py-2 text-sm text-ink-soft"><ArrowLeft size={15} className="mr-1 inline" />Voltar</Link><button type="submit" disabled={loading} className="rounded bg-volt px-6 py-2.5 text-sm font-medium text-base disabled:opacity-50">{loading ? "Salvando..." : "Salvar alterações"}</button></div>
      <div className="flex justify-end"><button type="button" onClick={() => window.confirm("Excluir produto permanentemente?") && deleteProduct(product.id)} className="text-xs text-alert">Excluir produto</button></div>
    </form>
  );
}
