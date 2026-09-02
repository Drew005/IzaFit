"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderTree, Trash2, AlertTriangle } from "lucide-react";
import { updateCategory, deleteCategory } from "@/lib/actions";

interface ParentCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
  };
}

export default function EditCategoryForm({
  category,
  parentCategories,
}: {
  category: Category;
  parentCategories: ParentCategory[];
}) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateCategoryWithId = updateCategory.bind(null, category.id);
  const hasDependencies =
    category._count.products > 0 || category._count.children > 0;

  async function handleDelete() {
    if (hasDependencies) {
      alert(
        `Não é possível excluir esta categoria pois ela possui ${category._count.products} produto(s) e ${category._count.children} subcategoria(s) vinculadas.`
      );
      return;
    }

    const confirm = window.confirm(
      "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteCategory(category.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir categoria.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateCategoryWithId}
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
                defaultValue={category.name}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Slug / Identificador URL
              </label>
              <input
                type="text"
                name="slug"
                required
                defaultValue={category.slug}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink font-mono focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Categoria Superior (Opcional)
              </label>
              <select
                name="parentId"
                defaultValue={category.parentId || ""}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="">Nenhuma (Esta é uma categoria principal)</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
            disabled={loading}
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Zona de Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir categoria
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            {hasDependencies
              ? `Esta categoria possui ${category._count.products} produto(s) e ${category._count.children} subcategoria(s). Remova os vínculos antes de excluir.`
              : "Esta categoria não possui produtos vinculados e pode ser excluída com segurança."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || hasDependencies}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-alert/40 text-alert text-xs font-medium hover:bg-alert hover:text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
        </button>
      </div>
    </div>
  );
}
