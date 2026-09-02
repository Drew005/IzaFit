import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const orderStatusLabels: Record<string, string> = {
  PAID: "Pago",
  COMPLETED: "Concluído",
  SHIPPED: "Enviado",
  PENDING: "Pendente",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const orderTone: Record<string, "positive" | "neutral" | "warning" | "muted"> = {
  Pago: "positive",
  Concluído: "positive",
  Enviado: "neutral",
  Pendente: "warning",
  Cancelado: "muted",
  Reembolsado: "muted",
};

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
  STORE_CREDIT: "Crédito loja",
};

export default async function VendasPage() {
  const orders = await prisma.order.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      payments: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Pedidos, pagamentos e status de entrega."
        action={
          <Link
            href="/admin/vendas/nova"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Nova venda
          </Link>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-soft border-b border-base-line">
              <th className="px-5 py-3 font-normal">Pedido</th>
              <th className="px-5 py-3 font-normal">Cliente</th>
              <th className="px-5 py-3 font-normal">Pagamento</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal text-right">Total</th>
              <th className="px-5 py-3 font-normal text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                  Nenhuma venda registrada.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const statusLabel = orderStatusLabels[o.status] ?? o.status;
                const paymentLabel = o.payments[0]
                  ? paymentMethodLabels[o.payments[0].method] ?? o.payments[0].method
                  : "N/A";
                const displayId = `PD-${o.id.slice(-4).toUpperCase()}`;

                return (
                  <tr
                    key={o.id}
                    className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                  >
                    <td className="px-5 py-3 text-ink-soft font-mono">
                      <Link
                        href={`/admin/vendas/${o.id}`}
                        className="hover:text-volt transition-colors"
                      >
                        {displayId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink">
                      {o.customer?.name ?? "Cliente Avulso"}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{paymentLabel}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={orderTone[statusLabel] ?? "muted"}>
                        {statusLabel}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-right text-ink font-medium">
                      {currency(Number(o.total))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/vendas/${o.id}`}
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
