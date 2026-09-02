import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Eye, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

const statusTone: Record<string, "positive" | "neutral" | "warning" | "muted"> = {
  Recebido: "positive",
  Pendente: "warning",
  Cancelado: "muted",
};

const purchaseStatusLabels: Record<string, string> = {
  RECEIVED: "Recebido",
  PENDING: "Pendente",
  CANCELED: "Cancelado",
};

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComprasPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { orderedAt: "desc" },
    include: {
      supplier: true,
      items: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Compras & fornecedores"
        description="Toda entrada de mercadoria — vira estoque e custo automaticamente."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/compras/fornecedores/novo"
              className="flex items-center gap-1.5 rounded-sm border border-base-line bg-base-raised px-3 py-2 text-sm text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
            >
              <Truck size={15} className="text-volt" />
              Novo fornecedor
            </Link>
            <Link
              href="/admin/compras/nova"
              className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
            >
              <Plus size={16} />
              Nova compra
            </Link>
          </div>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-base-line">
              <th className="px-5 py-3 font-normal">Compra</th>
              <th className="px-5 py-3 font-normal">Fornecedor</th>
              <th className="px-5 py-3 font-normal">Itens</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal text-right">Total</th>
              <th className="px-5 py-3 font-normal text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                  Nenhuma compra registrada.
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const statusLabel =
                  purchaseStatusLabels[p.status] ?? p.status;
                const displayId = `CP-${p.id.slice(-4).toUpperCase()}`;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                  >
                    <td className="px-5 py-3 text-ink-soft font-mono">
                      <Link
                        href={`/admin/compras/${p.id}`}
                        className="hover:text-volt transition-colors"
                      >
                        {displayId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink">{p.supplier.name}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {p.items.length} {p.items.length === 1 ? "variação" : "variações"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill tone={statusTone[statusLabel] ?? "muted"}>
                        {statusLabel}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-right text-ink font-medium">
                      {currency(Number(p.totalCost))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/compras/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-base-line bg-base text-xs text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
                      >
                        <Eye size={13} />
                        Ver
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
  );
}
