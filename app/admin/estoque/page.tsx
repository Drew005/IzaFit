import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const movementTypeLabels: Record<string, string> = {
  PURCHASE_IN: "Entrada (compra)",
  SALE_OUT: "Saída (venda)",
  RETURN_IN: "Devolução (cliente)",
  ADJUSTMENT: "Ajuste (avaria/perda)",
  TRANSFER: "Transferência",
};

export default async function EstoquePage() {
  const [stockMovements, variants] = await Promise.all([
    prisma.stockMovement.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        variant: {
          include: {
            product: true,
            attributeValues: {
              include: { attributeValue: true },
            },
          },
        },
      },
    }),
    prisma.productVariant.findMany({
      include: {
        product: true,
        attributeValues: {
          include: { attributeValue: true },
        },
      },
    }),
  ]);

  const lowStock = variants
    .filter((v) => v.stockQuantity <= v.minStockAlert)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Cada movimentação fica registrada — nada some do histórico."
        action={
          <Link
            href="/admin/estoque/movimentacao"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Nova movimentação
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-base-line">
            <h2 className="text-sm font-medium text-ink">Movimentações recentes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="px-5 py-3 font-normal">Data</th>
                <th className="px-5 py-3 font-normal">Item</th>
                <th className="px-5 py-3 font-normal">Tipo</th>
                <th className="px-5 py-3 font-normal text-right">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-soft">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                stockMovements.map((m) => {
                  const attrs = m.variant.attributeValues
                    .map((av) => av.attributeValue.value)
                    .join(" / ");
                  const itemName = attrs
                    ? `${m.variant.product.name} ${attrs}`
                    : m.variant.product.name;
                  const displayQty =
                    m.type === "SALE_OUT" ? -Math.abs(m.quantity) : m.quantity;
                  const dateStr = new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(m.createdAt));

                  return (
                    <tr key={m.id} className="border-b border-base-line/60 last:border-0">
                      <td className="px-5 py-3 text-ink-soft">{dateStr}</td>
                      <td className="px-5 py-3 text-ink">{itemName}</td>
                      <td className="px-5 py-3 text-ink-soft">
                        {movementTypeLabels[m.type] ?? m.type}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          displayQty < 0 ? "text-alert" : "text-volt"
                        }`}
                      >
                        {displayQty > 0 ? `+${displayQty}` : displayQty}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-base-line bg-base-raised p-5">
          <h2 className="text-sm font-medium text-ink mb-4">Alertas de reposição</h2>
          {lowStock.length === 0 ? (
            <p className="text-xs text-ink-soft">
              Nenhum item com estoque baixo no momento.
            </p>
          ) : (
            <ul className="space-y-4">
              {lowStock.map((v) => {
                const attrs = v.attributeValues
                  .map((av) => av.attributeValue.value)
                  .join(" / ");
                return (
                  <li key={v.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <p className="text-ink">{v.product.name}</p>
                      <StatusPill tone="warning">{v.stockQuantity} un.</StatusPill>
                    </div>
                    <p className="text-xs text-ink-soft mb-2">
                      {attrs || "Padrão"} · mínimo {v.minStockAlert}
                    </p>
                    <div className="h-1.5 rounded-full bg-base overflow-hidden">
                      <div
                        className="h-full bg-alert"
                        style={{
                          width: `${Math.min(
                            (v.stockQuantity / (v.minStockAlert || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
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
