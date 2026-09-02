import Link from "next/link";
import { User, Package, MapPin } from "lucide-react";
import { getCurrentCustomer, customerLogout } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/format";
import PerfilForm from "./PerfilForm";
import AddressManager from "./AddressManager";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  SHIPPED: "Enviado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export default async function PerfilPage() {
  const customer = await getCurrentCustomer();

  // Não logado
  if (!customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mx-auto max-w-md rounded-md border border-dashed border-base-line bg-base-raised p-10 text-center">
          <User size={40} className="mx-auto text-ink-soft/40" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            Faça login para ver seu perfil
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Acesse sua conta para ver seus dados, favoritos e acompanhar seus
            pedidos.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/entrar"
              className="rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
            >
              Entrar
            </Link>
            <Link
              href="/cadastrar"
              className="rounded-sm border border-base-line bg-base-raised px-5 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logado — busca dados + pedidos
  const full = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: {
      orders: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      },
    },
  });

  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Cliente desde {memberSince} ·{" "}
            {full?.loyaltyPoints ?? 0} pontos de fidelidade
          </p>
        </div>
        <form action={customerLogout}>
          <button
            type="submit"
            className="rounded-sm border border-base-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
          >
            Sair
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Dados + edição */}
        <div>
          <div className="rounded-md border border-base-line bg-base-raised p-5">
            <h2 className="text-sm font-medium text-ink">Seus dados</h2>
            <PerfilForm
              name={full?.name ?? ""}
              phone={full?.phone ?? ""}
              email={full?.email ?? ""}
            />
          </div>
        </div>

        {/* Endereços */}
        <AddressManager
          addresses={
            full?.addresses.map((a) => ({
              id: a.id,
              label: a.label,
              street: a.street,
              number: a.number,
              complement: a.complement,
              district: a.district,
              city: a.city,
              state: a.state,
              zipCode: a.zipCode,
              isDefault: a.isDefault,
            })) ?? []
          }
        />

        {/* Pedidos */}
        <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <div className="border-b border-base-line px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
              <Package size={15} className="text-volt" />
              Meus pedidos
            </h2>
          </div>

          {full?.orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">
              Você ainda não fez nenhum pedido.
            </p>
          ) : (
            <ul className="divide-y divide-base-line">
              {full?.orders.map((order) => (
                <li key={order.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">
                      Pedido{" "}
                      <span className="text-ink-soft">#{order.id.slice(-6)}</span>
                    </p>
                    <span className="rounded-sm bg-base px-2 py-0.5 text-xs text-ink-soft">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                    {order.items.reduce((a, i) => a + i.quantity, 0)}{" "}
                    {order.items.reduce((a, i) => a + i.quantity, 0) === 1
                      ? "item"
                      : "itens"}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {order.items.map((i) => (
                      <li key={i.id} className="truncate">
                        {i.quantity}× {i.variant.product.name} ({i.variant.sku})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-display text-base text-ink">
                    {currency(Number(order.total))}
                  </p>
                  {order.shippingStreet && (
                    <p className="mt-2 flex items-start gap-1 text-xs text-ink-soft">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span>
                        {order.shippingRecipient ?? ""} — {order.shippingStreet},{" "}
                        {order.shippingNumber}
                        {order.shippingComplement
                          ? ` — ${order.shippingComplement}`
                          : ""}
                        {order.shippingDistrict
                          ? `, ${order.shippingDistrict}`
                          : ""}
                        {order.shippingCity
                          ? ` — ${order.shippingCity}/${order.shippingState}`
                          : ""}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
