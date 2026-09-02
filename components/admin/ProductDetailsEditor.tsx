"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import type { ProductDetails, ProductDetailsSection } from "@/lib/product-details";

// Normaliza o que vier do banco (JsonValue do Prisma) para o estado interno.
// O Prisma devolve objetos com `{ title, items }`, então o cast é seguro
// porque o editor só abre com valores já validados por parseProductDetails.
function normalizeSections(value: unknown): ProductDetailsSection[] {
  if (Array.isArray(value)) {
    const parsed = value
      .filter(
        (s): s is ProductDetailsSection =>
          !!s && typeof s === "object" && "items" in s && Array.isArray(s.items)
      )
      .map((s) => ({ title: s.title ?? null, items: s.items.map(String) }));
    if (parsed.length > 0) return parsed;
  }
  return [{ title: "Características", items: [] }];
}

// Editor de "Características & Detalhes" do produto.
// Cada seção tem um título opcional e uma lista de itens (um por linha).
// O resultado vai para um hidden input `name="details"` como JSON string.
export default function ProductDetailsEditor({
  value,
}: {
  value?: unknown;
}) {
  const [sections, setSections] = useState<ProductDetailsSection[]>(() =>
    normalizeSections(value)
  );

  function updateSection(index: number, patch: Partial<ProductDetailsSection>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { title: "", items: [] },
    ]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, itemIndex: number, text: string) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const items = [...s.items];
        items[itemIndex] = text;
        return { ...s, items };
      })
    );
  }

  function removeItem(index: number, itemIndex: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, items: s.items.filter((_, j) => j !== itemIndex) } : s
      )
    );
  }

  function addItem(index: number) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, items: [...s.items, ""] } : s))
    );
  }

  const isEmpty =
    sections.length === 0 ||
    sections.every((s) => s.items.every((i) => !i.trim()));

  return (
    <div className="rounded-md border border-base-line bg-base-raised p-6">
      <div className="flex items-center gap-2">
        <ListChecks size={18} className="text-volt" />
        <div>
          <h2 className="text-base font-medium text-ink">
            Características & Detalhes
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Ex.: compressão média, composição do tecido, instruções de lavação.
          </p>
        </div>
      </div>

      <input type="hidden" name="details" value={isEmpty ? "" : JSON.stringify(
        sections
          .map((s) => ({
            ...(s.title?.trim() ? { title: s.title.trim() } : {}),
            items: s.items.map((i) => i.trim()).filter(Boolean),
          }))
          .filter((s) => s.items.length > 0)
      )} />

      <div className="mt-5 space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="rounded-md border border-base-line bg-base p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={section.title ?? ""}
                onChange={(e) => updateSection(index, { title: e.target.value })}
                placeholder="Título da seção (ex.: Características, Composição)"
                className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-volt focus:outline-none"
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  title="Remover seção"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-base-line bg-base-raised text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-2">
                  <span className="text-volt">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(index, itemIndex, e.target.value)}
                    placeholder="Nova característica ou detalhe"
                    className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-volt focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index, itemIndex)}
                    title="Remover item"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-ink-soft/60 transition-colors hover:text-alert"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addItem(index)}
              className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-volt"
            >
              <Plus size={13} />
              Adicionar item
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSection}
        className="mt-4 flex items-center gap-1.5 rounded-sm border border-dashed border-base-line px-3 py-2 text-xs text-ink-soft transition-colors hover:border-volt/60 hover:text-ink"
      >
        <Plus size={14} />
        Adicionar seção
      </button>
    </div>
  );
}