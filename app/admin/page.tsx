import MetricCard from "@/components/MetricCard";
import RevenueChart from "@/components/RevenueChart";
import PaymentDonut from "@/components/PaymentDonut";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { AlertTriangle } from "lucide-react";

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

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default async function OverviewPage() {
  const [orders, expenses, purchases, variants, payments] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        payments: true,
        items: {
          include: {
            variant: true,
          },
        },
      },
    }),
    prisma.expense.findMany({
      orderBy: { dueDate: "desc" },
    }),
    prisma.purchase.findMany({
      where: { status: "RECEIVED" },
      orderBy: { orderedAt: "desc" },
    }),
    prisma.productVariant.findMany({
      include: {
        product: true,
        attributeValues: {
          include: { attributeValue: true },
        },
      },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["APPROVED", "PENDING"] } },
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  // Current month orders
  const paidOrders = orders.filter((o) =>
    ["PAID", "COMPLETED", "SHIPPED"].includes(o.status)
  );

  const currentMonthPaidOrders = paidOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthPurchases = purchases.filter((p) => {
    const d = new Date(p.orderedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const receitaMes = currentMonthPaidOrders.reduce(
    (acc, o) => acc + Number(o.total),
    0
  );

  const custoMercadorias = currentMonthPaidOrders.reduce((acc, o) => {
    const orderCost = o.items.reduce(
      (itemAcc, item) =>
        itemAcc + Number(item.variant.costPrice) * item.quantity,
      0
    );
    return acc + orderCost;
  }, 0);

  const despesasMes = currentMonthExpenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );
  const comprasMes = currentMonthPurchases.reduce(
    (acc, p) => acc + Number(p.totalCost),
    0
  );

  const totalGastosMes = despesasMes + (custoMercadorias > 0 ? custoMercadorias : comprasMes);
  const lucroMes = receitaMes - totalGastosMes;
  const pedidosMes = currentMonthPaidOrders.length;
  const ticketMedio = pedidosMes > 0 ? receitaMes / pedidosMes : 0;

  // Previous month calculations
  const previousMonthPaidOrders = paidOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
  });

  const previousMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.dueDate);
    return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
  });

  const previousMonthPurchases = purchases.filter((p) => {
    const d = new Date(p.orderedAt);
    return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
  });

  const receitaMesAnterior = previousMonthPaidOrders.reduce(
    (acc, o) => acc + Number(o.total),
    0
  );

  const custoMercadoriasAnterior = previousMonthPaidOrders.reduce((acc, o) => {
    const orderCost = o.items.reduce(
      (itemAcc, item) =>
        itemAcc + Number(item.variant.costPrice) * item.quantity,
      0
    );
    return acc + orderCost;
  }, 0);

  const despesasMesAnterior = previousMonthExpenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );

  const comprasMesAnterior = previousMonthPurchases.reduce(
    (acc, p) => acc + Number(p.totalCost),
    0
  );

  const totalGastosMesAnterior =
    despesasMesAnterior +
    (custoMercadoriasAnterior > 0 ? custoMercadoriasAnterior : comprasMesAnterior);

  const lucroMesAnterior = receitaMesAnterior - totalGastosMesAnterior;
  const pedidosMesAnterior = previousMonthPaidOrders.length;
  const ticketMedioAnterior =
    pedidosMesAnterior > 0 ? receitaMesAnterior / pedidosMesAnterior : 0;

  function percentageDelta(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  }

  // 6 months trend
  const revenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const m = targetDate.getMonth();
    const y = targetDate.getFullYear();

    const mOrders = paidOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const mExpenses = expenses.filter((e) => {
      const d = new Date(e.dueDate);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const mPurchases = purchases.filter((p) => {
      const d = new Date(p.orderedAt);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const mReceita = mOrders.reduce((acc, o) => acc + Number(o.total), 0);
    const mGastos =
      mExpenses.reduce((acc, e) => acc + Number(e.amount), 0) +
      mPurchases.reduce((acc, p) => acc + Number(p.totalCost), 0);

    revenueTrend.push({
      month: MONTH_NAMES[m],
      receita: mReceita,
      gastos: mGastos,
    });
  }

  // Payment split
  const paymentTotals: Record<string, number> = {};
  let totalPaymentAmount = 0;
  for (const payment of payments) {
    const label = paymentMethodLabels[payment.method] ?? payment.method;
    const val = Number(payment.amount);
    paymentTotals[label] = (paymentTotals[label] ?? 0) + val;
    totalPaymentAmount += val;
  }

  const paymentSplit = Object.entries(paymentTotals).map(([name, val]) => ({
    name,
    value: totalPaymentAmount > 0 ? Math.round((val / totalPaymentAmount) * 100) : 0,
  }));

  // If no payments yet, show empty or default breakdown
  const finalPaymentSplit =
    paymentSplit.length > 0
      ? paymentSplit
      : [
          { name: "PIX", value: 0 },
          { name: "Cartão de crédito", value: 0 },
          { name: "Cartão de débito", value: 0 },
          { name: "Dinheiro", value: 0 },
        ];

  // Low stock
  const lowStock = variants
    .filter((v) => v.stockQuantity <= v.minStockAlert)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5);

  const currentDateFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-ink-soft capitalize">{currentDateFormatted}</p>
        <h1 className="font-display text-3xl text-ink mt-1">Visão geral</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Receita do mês"
          value={currency(receitaMes)}
          delta={percentageDelta(receitaMes, receitaMesAnterior)}
        />
        <MetricCard
          label="Lucro do mês"
          value={currency(lucroMes)}
          delta={percentageDelta(lucroMes, lucroMesAnterior)}
        />
        <MetricCard
          label="Ticket médio"
          value={currency(ticketMedio)}
          delta={percentageDelta(ticketMedio, ticketMedioAnterior)}
        />
        <MetricCard
          label="Pedidos"
          value={String(pedidosMes)}
          delta={percentageDelta(pedidosMes, pedidosMesAnterior)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-md border border-base-line bg-base-raised p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-ink">Receita vs. gastos</h2>
            <p className="text-xs text-ink-soft">últimos 6 meses</p>
          </div>
          <RevenueChart data={revenueTrend} />
        </div>

        <div className="rounded-md border border-base-line bg-base-raised p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Formas de pagamento</h2>
          <PaymentDonut data={finalPaymentSplit} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-md border border-base-line bg-base-raised p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Pedidos recentes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="pb-2 font-normal">Pedido</th>
                <th className="pb-2 font-normal">Cliente</th>
                <th className="pb-2 font-normal">Pagamento</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink-soft">
                    Nenhum pedido recente.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const statusLabel = orderStatusLabels[o.status] ?? o.status;
                  const paymentLabel = o.payments[0]
                    ? paymentMethodLabels[o.payments[0].method] ?? o.payments[0].method
                    : "N/A";
                  const displayId = `PD-${o.id.slice(-4).toUpperCase()}`;

                  return (
                    <tr
                      key={o.id}
                      className="border-b border-base-line/60 last:border-0"
                    >
                      <td className="py-3 text-ink-soft">{displayId}</td>
                      <td className="py-3 text-ink">
                        {o.customer?.name ?? "Cliente Avulso"}
                      </td>
                      <td className="py-3 text-ink-soft">{paymentLabel}</td>
                      <td className="py-3">
                        <StatusPill tone={orderTone[statusLabel] ?? "muted"}>
                          {statusLabel}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-right text-ink">
                        {currency(Number(o.total))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-base-line bg-base-raised p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-alert" />
            <h2 className="text-sm font-medium text-ink">Estoque baixo</h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-ink-soft">Nenhum alerta de estoque baixo.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((v) => {
                const attrs = v.attributeValues
                  .map((av) => av.attributeValue.value)
                  .join(" / ");
                return (
                  <li
                    key={v.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="text-ink">{v.product.name}</p>
                      <p className="text-xs text-ink-soft">{attrs || "Padrão"}</p>
                    </div>
                    <span className="text-alert font-medium">
                      {v.stockQuantity} un.
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
