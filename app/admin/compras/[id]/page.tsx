import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Truck, Calendar, PackageCheck, FileText } from "lucide-react";
import PurchaseStatusUpdater from "./PurchaseStatusUpdater";

export const dynamic = "force-dynamic";

interface PurchaseDetailPageProps {
  params: {
    id: string;
  };
}

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

export default async function PurchaseDetailPage({ params }: PurchaseDetailPageProps) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
              attributeValues: {
                include: {
                  attributeValue: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!purchase) {
    notFound();
  }

  const displayId = `CP-${purchase.id.slice(-4).toUpperCase()}`;
  const statusLabel = purchaseStatusLabels[purchase.status] ?? purchase.status;
  const orderedDateStr = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(purchase.orderedAt));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/compras"
          className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para lista de compras
        </Link>

        <StatusPill tone={statusTone[statusLabel] ?? "muted"}>
          {statusLabel}
        </StatusPill>
      </div>

      <PageHeader
        title={`Compra ${displayId}`}
        description={`Pedido realizado em ${orderedDateStr}`}
      />

      {/* Gerenciar Status / Recebimento */}
      <PurchaseStatusUpdater
        purchaseId={purchase.id}
        currentStatus={purchase.status}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Itens Comprados */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <PackageCheck size={16} className="text-volt" />
              <span>Itens da Compra ({purchase.items.length})</span>
            </div>

            <div className="divide-y divide-base-line/60">
              {purchase.items.map((item) => {
                const attrs = item.variant.attributeValues
                  .map((av) => av.attributeValue.value)
                  .join(" / ");
                const lineTotal = Number(item.quantity) * Number(item.unitCost);

                return (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {item.variant.product.name}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {attrs ? `Variação: ${attrs}` : ""} · SKU: {item.variant.sku}
                      </p>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {item.quantity} un. x {currency(Number(item.unitCost))}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-medium text-ink">
                        {currency(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-base-line pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Custo Total da Compra:</span>
              <span className="text-volt font-semibold text-lg">
                {currency(Number(purchase.totalCost))}
              </span>
            </div>
          </div>
        </div>

        {/* Fornecedor & Observações */}
        <div className="space-y-6">
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <Truck size={16} className="text-volt" />
              <span>Fornecedor</span>
            </div>

            <div className="space-y-2 text-xs text-ink">
              <div>
                <span className="text-ink-soft block">Razão / Nome:</span>
                <span className="font-medium text-ink">{purchase.supplier.name}</span>
              </div>

              {purchase.supplier.cnpj && (
                <div>
                  <span className="text-ink-soft block">CNPJ:</span>
                  <span>{purchase.supplier.cnpj}</span>
                </div>
              )}

              {purchase.supplier.phone && (
                <div>
                  <span className="text-ink-soft block">Telefone:</span>
                  <span>{purchase.supplier.phone}</span>
                </div>
              )}

              {purchase.supplier.email && (
                <div>
                  <span className="text-ink-soft block">E-mail:</span>
                  <span>{purchase.supplier.email}</span>
                </div>
              )}
            </div>
          </div>

          {purchase.notes && (
            <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-2">
              <div className="flex items-center gap-2 text-ink font-medium text-xs border-b border-base-line pb-2">
                <FileText size={14} className="text-volt" />
                <span>Observações & Notas</span>
              </div>
              <p className="text-xs text-ink-soft">{purchase.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
