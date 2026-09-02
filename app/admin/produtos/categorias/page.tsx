import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { Plus, ArrowLeft, Edit2, FolderTree } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: { products: true, children: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/produtos"
          className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para produtos
        </Link>
      </div>

      <PageHeader
        title="Categorias de Produtos"
        description="Organize o catálogo de roupas, suplementos e acessórios em categorias e subcategorias."
        action={
          <Link
            href="/admin/produtos/categorias/nova"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Nova categoria
          </Link>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-base-line">
              <th className="px-5 py-3 font-normal">Categoria</th>
              <th className="px-5 py-3 font-normal">Slug / URL</th>
              <th className="px-5 py-3 font-normal">Categoria Superior</th>
              <th className="px-5 py-3 font-normal text-center">Produtos</th>
              <th className="px-5 py-3 font-normal text-center">Subcategorias</th>
              <th className="px-5 py-3 font-normal text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                >
                  <td className="px-5 py-3 text-ink font-medium">
                    <div className="flex items-center gap-2">
                      <FolderTree size={15} className="text-volt" />
                      <Link
                        href={`/admin/produtos/categorias/${c.id}/editar`}
                        className="hover:text-volt transition-colors"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {c.parent ? c.parent.name : "— Principal"}
                  </td>
                  <td className="px-5 py-3 text-center text-ink">
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-base border border-base-line text-xs font-mono">
                      {c._count.products}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-ink-soft">
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-base border border-base-line text-xs font-mono">
                      {c._count.children}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/produtos/categorias/${c.id}/editar`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-base-line bg-base text-xs text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
                    >
                      <Edit2 size={13} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
