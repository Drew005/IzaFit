import Link from "next/link";
import { User, ShoppingBag } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPublicKey } from "@/lib/mercadopago";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function FinalizarPage() {
  const customer = await getCurrentCustomer();

  // Não logado
  if (!customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mx-auto max-w-md rounded-md border border-dashed border-base-line bg-base-raised p-10 text-center">
          <User size={40} className="mx-auto text-ink-soft/40" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            Faça login para finalizar
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Você precisa de uma conta para finalizar a compra e escolher o
            endereço de entrega.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/entrar?next=/finalizar"
              className="rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
            >
              Entrar
            </Link>
            <Link
              href="/cadastrar?next=/finalizar"
              className="rounded-sm border border-base-line bg-base-raised px-5 py-2.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Finalizar compra
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Revise os itens, escolha o endereço de entrega e o pagamento.
          </p>
        </div>
        <Link
          href="/carrinho"
          className="flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <ShoppingBag size={15} />
          Voltar ao carrinho
        </Link>
      </div>

      <CheckoutForm
        customerName={customer.name}
        customerCpf={customer.cpf ?? null}
        mpPublicKey={getMercadoPagoPublicKey()}
        addresses={addresses.map((a) => ({
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
        }))}
      />
    </div>
  );
}