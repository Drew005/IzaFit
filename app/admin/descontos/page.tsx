import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, BadgePercent, Edit2, Trash2 } from "lucide-react";
import { deleteDiscount } from "@/lib/actions";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const discountTone: Record<string, "positive" | "neutral" | "warning" | "muted"> = {
  Ativo: "positive",
  Agendado: "neutral",
  Expirado: "muted",
  Inativo: "muted",
};

function targetLabel(d: {
  productId: string | null;
  categoryId: string | null;
  variantId: string | null;
  product?: { name: string } | null;
  category?: { name: string } | null;
  variant?: { sku: string; product: { name: string } } | null;
}) {
  if (d.variantId && d.variant) return `Variação: ${d.variant.product.name} (${d.variant.sku})`;
  if (d.productId && d.product) return `Produto: ${d.product.name}`;
  if (d.categoryId && d.category) return `Categoria: ${d.category.name}`;
  return "Catálogo completo";
}

export default async function DescontosPage() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      variant: {
        select: { id: true, sku: true, product: { select: { name: true } } },
      },
    },
  });

  const now = new Date();

  return (
    <div className="space-y-10">
      <div>
        <PageHeader
          title="Descontos"
          description="Aplique descontos automáticos a produtos, categorias ou variações específicas."
          action={
            <Link
              href="/admin/descontos/novo"
              className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
            >
              <Plus size={16} />
              Novo desconto
            </Link>
          }
        />

        <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                  <th className="px-5 py-3 font-normal">Nome</th>
                  <th className="px-5 py-3 font-normal">Alvo</th>
                  <th className="px-5 py-3 font-normal">Tipo</th>
                  <th className="px-5 py-3 font-normal">Valor</th>
                  <th className="px-5 py-3 font-normal">Validade</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-ink-soft">
                      Nenhum desconto cadastrado.
                    </td>
                  </tr>
                ) : (
                  discounts.map((d) => {
                    let status: "Ativo" | "Agendado" | "Expirado" | "Inativo" = "Ativo";
                    if (!d.active) {
                      status = "Inativo";
                    } else if (d.validUntil && new Date(d.validUntil) < now) {
                      status = "Expirado";
                    }

                    const tipo = d.type === "PERCENTAGE" ? "Percentual" : "Fixo";
                    const valor =
                      d.type === "PERCENTAGE"
                        ? `${Number(d.value)}%`
                        : currency(Number(d.value));
                    const validade = d.validUntil
                      ? new Intl.DateTimeFormat("pt-BR").format(new Date(d.validUntil))
                      : "sem prazo";

                    return (
                      <tr
                        key={d.id}
                        className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                      >
                        <td className="px-5 py-3 text-ink font-medium">
                          <Link
                            href={`/admin/descontos/${d.id}/editar`}
                            className="hover:text-volt transition-colors"
                          >
                            {d.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{targetLabel(d)}</td>
                        <td className="px-5 py-3 text-ink-soft">{tipo}</td>
                        <td className="px-5 py-3 text-ink font-medium">{valor}</td>
                        <td className="px-5 py-3 text-ink-soft">{validade}</td>
                        <td className="px-5 py-3">
                          <StatusPill tone={discountTone[status]}>
                            {status}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/descontos/${d.id}/editar`}
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
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-volt/20 bg-volt/5 p-4 text-xs text-ink-soft">
        <BadgePercent size={16} className="text-volt shrink-0 mt-0.5" />
        <p>
          Os descontos são aplicados automaticamente ao valor das variações durante a venda
          (balcão e online). Um desconto pode ser vinculado a um produto, a uma categoria inteira
          ou a uma variação específica (ex.: só o tamanho M). Escolha apenas um alvo por desconto.
        </p>
      </div>
    </div>
  );
}
