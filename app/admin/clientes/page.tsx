import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { Plus, Edit2 } from "lucide-react";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Histórico de compras e pontos de fidelidade."
        action={
          <Link
            href="/admin/clientes/novo"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Novo cliente
          </Link>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="px-5 py-3 font-normal">Cliente</th>
                <th className="px-5 py-3 font-normal">Pedidos</th>
                <th className="px-5 py-3 font-normal">Total gasto</th>
                <th className="px-5 py-3 font-normal">Pontos de fidelidade</th>
                <th className="px-5 py-3 font-normal">Última compra</th>
                <th className="px-5 py-3 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const totalSpent = c.orders.reduce(
                    (acc, o) => acc + Number(o.total),
                    0
                  );
                  const lastOrderDate = c.orders[0]
                    ? new Intl.DateTimeFormat("pt-BR").format(
                        new Date(c.orders[0].createdAt)
                      )
                    : "Sem compras";

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                    >
                      <td className="px-5 py-3 text-ink font-medium">
                        <Link
                          href={`/admin/clientes/${c.id}/editar`}
                          className="hover:text-volt transition-colors"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{c.orders.length}</td>
                      <td className="px-5 py-3 text-ink font-medium">{currency(totalSpent)}</td>
                      <td className="px-5 py-3 text-volt font-medium">{c.loyaltyPoints} pts</td>
                      <td className="px-5 py-3 text-ink-soft">{lastOrderDate}</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/clientes/${c.id}/editar`}
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
  );
}
