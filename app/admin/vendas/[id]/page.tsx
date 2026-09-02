import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, User, Calendar, CreditCard, ShoppingBag, Gift } from "lucide-react";
import OrderStatusUpdater from "./OrderStatusUpdater";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

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
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
  STORE_CREDIT: "Crédito Loja",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: {
        include: {
          addresses: true,
        },
      },
      coupon: true,
      payments: true,
      gifts: {
        include: {
          gift: true,
        },
      },
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

  if (!order) {
    notFound();
  }

  const displayId = `PD-${order.id.slice(-4).toUpperCase()}`;
  const statusLabel = orderStatusLabels[order.status] ?? order.status;
  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/vendas"
          className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para lista de vendas
        </Link>

        <StatusPill tone={orderTone[statusLabel] ?? "muted"}>
          {statusLabel}
        </StatusPill>
      </div>

      <PageHeader
        title={`Pedido ${displayId}`}
        description={`Registrado em ${dateStr}`}
      />

      {/* Alterar Status */}
      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Itens do Pedido */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <ShoppingBag size={16} className="text-volt" />
              <span>Itens Comprados ({order.items.length})</span>
            </div>

            <div className="divide-y divide-base-line/60">
              {order.items.map((item) => {
                const attrs = item.variant.attributeValues
                  .map((av) => av.attributeValue.value)
                  .join(" / ");

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
                        {item.quantity}x {currency(Number(item.unitPrice))}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-medium text-ink">
                        {currency(Number(item.subtotal))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totais */}
            <div className="border-t border-base-line pt-4 space-y-1.5 text-xs text-ink">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal:</span>
                <span>{currency(Number(order.subtotal))}</span>
              </div>

              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-volt">
                  <span>
                    Desconto {order.coupon ? `(Cupom ${order.coupon.code})` : ""}:
                  </span>
                  <span>- {currency(Number(order.discount))}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-semibold text-ink border-t border-base-line pt-2">
                <span>Total do Pedido:</span>
                <span className="text-volt">{currency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <CreditCard size={16} className="text-volt" />
              <span>Registro de Pagamento</span>
            </div>

            {order.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs text-ink p-3 rounded-sm bg-base border border-base-line"
              >
                <div>
                  <p className="font-medium text-ink">
                    {paymentMethodLabels[p.method] ?? p.method}
                    {p.installments > 1 && ` (${p.installments}x)`}
                  </p>
                  <p className="text-ink-soft text-[11px]">
                    Status: {p.status === "APPROVED" ? "Aprovado" : "Pendente"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-volt">
                    {currency(Number(p.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brindes */}
        {order.gifts.length > 0 && (
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <Gift size={16} className="text-volt" />
              <span>Brindes Entregues ({order.gifts.length})</span>
            </div>

            <div className="divide-y divide-base-line/60">
              {order.gifts.map((og) => (
                <div
                  key={og.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {og.gift.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Qtd: {og.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações do Cliente */}
        <div className="space-y-6">
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm border-b border-base-line pb-3">
              <User size={16} className="text-volt" />
              <span>Cliente</span>
            </div>

            {order.customer ? (
              <div className="space-y-2 text-xs text-ink">
                <div>
                  <span className="text-ink-soft block">Nome:</span>
                  <Link
                    href={`/admin/clientes/${order.customer.id}/editar`}
                    className="font-medium text-volt hover:underline"
                  >
                    {order.customer.name}
                  </Link>
                </div>

                {order.customer.email && (
                  <div>
                    <span className="text-ink-soft block">E-mail:</span>
                    <span>{order.customer.email}</span>
                  </div>
                )}

                {order.customer.phone && (
                  <div>
                    <span className="text-ink-soft block">Telefone:</span>
                    <span>{order.customer.phone}</span>
                  </div>
                )}

                {order.customer.cpf && (
                  <div>
                    <span className="text-ink-soft block">CPF:</span>
                    <span>{order.customer.cpf}</span>
                  </div>
                )}

                <div>
                  <span className="text-ink-soft block">Pontos Fidelidade:</span>
                  <span className="text-volt font-medium">
                    {order.customer.loyaltyPoints} pts
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-soft">
                Cliente Avulso (não identificado no cadastro).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
