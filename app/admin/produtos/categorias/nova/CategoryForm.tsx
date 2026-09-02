"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderTree } from "lucide-react";
import { createCategory } from "@/lib/actions";

interface ParentCategory {
  id: string;
  name: string;
}

export default function CategoryForm({
  parentCategories,
}: {
  parentCategories: ParentCategory[];
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  function handleNameChange(val: string) {
    setName(val);
    if (autoSlug) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  return (
    <form
      action={createCategory}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <FolderTree size={16} className="text-volt" />
          <span>Informações da Categoria</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Nome da Categoria *
            </label>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Suplementos, Calçados, Tops & Croppeds"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink-soft">
                Slug / Identificador URL
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  className="rounded border-base-line bg-base text-volt focus:ring-0"
                />
                <span>Gerar automaticamente</span>
              </label>
            </div>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              placeholder="ex: suplementos"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink font-mono focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Categoria Superior / Categoria Pai (Opcional)
            </label>
            <select
              name="parentId"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="">Nenhuma (Esta é uma categoria principal)</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink-soft mt-1">
              Use caso queira criar uma subcategoria (ex: "Whey Protein" dentro de "Suplementos").
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/produtos/categorias"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para categorias
        </Link>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Cadastrando..." : "Cadastrar Categoria"}
        </button>
      </div>
    </form>
  );
}
