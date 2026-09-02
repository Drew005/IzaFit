import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Edit2, FolderTree, Shirt } from "lucide-react";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo completo — roupas, suplementos e acessórios num só lugar."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/produtos/categorias"
              className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base-raised px-3 py-2 text-sm text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
            >
              <FolderTree size={15} className="text-volt" />
              Categorias
            </Link>
            <Link
              href="/admin/produtos/novo"
              className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
            >
              <Plus size={16} />
              Novo produto
            </Link>
          </div>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-base-line">
              <th className="px-5 py-3 font-normal">Produto</th>
              <th className="px-5 py-3 font-normal">Categoria</th>
              <th className="px-5 py-3 font-normal">Variações</th>
              <th className="px-5 py-3 font-normal">Preço</th>
              <th className="px-5 py-3 font-normal">Estoque total</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink-soft">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = p.variants.reduce(
                  (acc, v) => acc + v.stockQuantity,
                  0
                );
                const minPrice =
                  p.variants.length > 0
                    ? Math.min(...p.variants.map((v) => Number(v.sellPrice)))
                    : 0;
                const productImage = p.imageUrl || p.images?.[0] || null;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/produtos/${p.id}/editar`}
                        className="flex items-center gap-3 hover:text-volt transition-colors"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-base-line bg-base">
                          {productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={productImage}
                              alt={`Foto de ${p.name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Shirt size={18} className="text-ink-soft/40" />
                          )}
                        </span>
                        <span className="font-medium text-ink">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.category?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-ink-soft">{p.variants.length}</td>
                    <td className="px-5 py-3 text-ink">{currency(minPrice)}</td>
                    <td className="px-5 py-3 text-ink-soft">{totalStock} un.</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={p.active ? "positive" : "muted"}>
                        {p.active ? "Ativo" : "Inativo"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/produtos/${p.id}/editar`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-base-line bg-base text-xs text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
                      >
                        <Edit2 size={13} />
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-soft mt-4">
        Categorias como "Suplementos" e "Acessórios" já convivem com roupas no mesmo catálogo —
        criar uma linha de whey ou coqueteleiras não exige nenhuma mudança de estrutura.
      </p>
    </div>
  );
}
