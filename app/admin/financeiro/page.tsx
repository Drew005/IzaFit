import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import RevenueChart from "@/components/RevenueChart";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Edit2 } from "lucide-react";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const expenseCategoryLabels: Record<string, string> = {
  RENT: "Aluguel",
  UTILITIES: "Utilidades",
  MARKETING: "Marketing",
  SALARY: "Salários",
  SOFTWARE: "Software",
  LOGISTICS: "Logística",
  OTHER: "Outros",
};

const expenseTone: Record<string, "positive" | "neutral" | "warning" | "muted"> = {
  Pago: "positive",
  Pendente: "warning",
};

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default async function FinanceiroPage() {
  const [orders, expenses, purchases] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "COMPLETED", "SHIPPED"] },
      },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      orderBy: { dueDate: "desc" },
    }),
    prisma.purchase.findMany({
      where: {
        status: "RECEIVED",
      },
      orderBy: { orderedAt: "desc" },
    }),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  // Current month calculations
  const currentMonthOrders = orders.filter((o) => {
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

  const receitaMes = currentMonthOrders.reduce(
    (acc, o) => acc + Number(o.total),
    0
  );

  const custoMercadoriasVendidas = currentMonthOrders.reduce((acc, o) => {
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

  const totalGastosMes = despesasMes + (custoMercadoriasVendidas > 0 ? custoMercadoriasVendidas : comprasMes);
  const lucroMes = receitaMes - totalGastosMes;
  const margemValor = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;
  const margem = margemValor.toFixed(0);

  // Previous month calculations
  const previousMonthOrders = orders.filter((o) => {
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

  const receitaMesAnterior = previousMonthOrders.reduce(
    (acc, o) => acc + Number(o.total),
    0
  );

  const custoMercadoriasAnterior = previousMonthOrders.reduce((acc, o) => {
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
  const margemAnteriorValor =
    receitaMesAnterior > 0 ? (lucroMesAnterior / receitaMesAnterior) * 100 : 0;

  function percentageDelta(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
  }

  // Last 6 months trend
  const revenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const m = targetDate.getMonth();
    const y = targetDate.getFullYear();

    const mOrders = orders.filter((o) => {
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

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receita, custo de mercadoria e despesas fixas num só painel."
        action={
          <Link
            href="/admin/financeiro/despesas/nova"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Nova despesa
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Receita do mês" value={currency(receitaMes)} delta={percentageDelta(receitaMes, receitaMesAnterior)} />
        <MetricCard label="Lucro do mês" value={currency(lucroMes)} delta={percentageDelta(lucroMes, lucroMesAnterior)} />
        <MetricCard label="Gastos do mês" value={currency(totalGastosMes)} delta={percentageDelta(totalGastosMes, totalGastosMesAnterior)} />
        <MetricCard label="Margem" value={margem} suffix="%" delta={percentageDelta(margemValor, margemAnteriorValor)} />
      </div>

      <div className="rounded-md border border-base-line bg-base-raised p-5 mb-6">
        <h2 className="text-sm font-medium text-ink mb-2">Receita vs. gastos</h2>
        <RevenueChart data={revenueTrend} />
      </div>

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-base-line flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Despesas cadastradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="px-5 py-3 font-normal">Categoria</th>
                <th className="px-5 py-3 font-normal">Descrição</th>
                <th className="px-5 py-3 font-normal">Vencimento</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal text-right">Valor</th>
                <th className="px-5 py-3 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                    Nenhuma despesa cadastrada.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const status = e.paidAt ? "Pago" : "Pendente";
                  const cat = expenseCategoryLabels[e.category] ?? e.category;
                  const dueDateStr = new Intl.DateTimeFormat("pt-BR").format(
                    new Date(e.dueDate)
                  );

                  return (
                    <tr key={e.id} className="border-b border-base-line/60 last:border-0 hover:bg-base/40">
                      <td className="px-5 py-3 text-ink-soft">{cat}</td>
                      <td className="px-5 py-3 text-ink">
                        <Link
                          href={`/admin/financeiro/despesas/${e.id}/editar`}
                          className="hover:text-volt transition-colors font-medium"
                        >
                          {e.description}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{dueDateStr}</td>
                      <td className="px-5 py-3">
                        <StatusPill tone={expenseTone[status]}>
                          {status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3 text-right text-ink font-medium">
                        {currency(Number(e.amount))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/financeiro/despesas/${e.id}/editar`}
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
