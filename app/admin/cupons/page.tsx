import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Gift as GiftIcon, Edit2, Trash2 } from "lucide-react";
import { deleteGift } from "@/lib/actions";

export const dynamic = "force-dynamic";

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const couponTone: Record<string, "positive" | "neutral" | "warning" | "muted"> = {
  Ativo: "positive",
  Agendado: "neutral",
  Expirado: "muted",
};

export default async function CuponsPage() {
  const [coupons, gifts] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { validFrom: "desc" },
    }),
    prisma.gift.findMany({
      orderBy: { name: "asc" },
      include: {
        product: true,
        category: true,
      },
    }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-10">
      <div>
        <PageHeader
          title="Cupons"
          description="Descontos por código, com limite de uso e validade."
          action={
            <Link
              href="/admin/cupons/novo"
              className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
            >
              <Plus size={16} />
              Novo cupom
            </Link>
          }
        />

        <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="px-5 py-3 font-normal">Código</th>
                <th className="px-5 py-3 font-normal">Tipo</th>
                <th className="px-5 py-3 font-normal">Valor</th>
                <th className="px-5 py-3 font-normal">Usos</th>
                <th className="px-5 py-3 font-normal">Validade</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-soft">
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  let status: "Ativo" | "Agendado" | "Expirado" = "Ativo";
                  if (!c.active) {
                    status = "Expirado";
                  } else if (new Date(c.validFrom) > now) {
                    status = "Agendado";
                  } else if (c.validUntil && new Date(c.validUntil) < now) {
                    status = "Expirado";
                  }

                  const tipo = c.type === "PERCENTAGE" ? "Percentual" : "Fixo";
                  const valor =
                    c.type === "PERCENTAGE"
                      ? `${Number(c.value)}%`
                      : currency(Number(c.value));
                  const usos = `${c.usedCount}/${c.maxUses ?? "∞"}`;
                  const validade = c.validUntil
                    ? new Intl.DateTimeFormat("pt-BR").format(new Date(c.validUntil))
                    : "sem prazo";

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                    >
                      <td className="px-5 py-3 text-ink font-medium">
                        <Link
                          href={`/admin/cupons/${c.id}/editar`}
                          className="hover:text-volt transition-colors font-mono"
                        >
                          {c.code}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{tipo}</td>
                      <td className="px-5 py-3 text-ink">{valor}</td>
                      <td className="px-5 py-3 text-ink-soft">{usos}</td>
                      <td className="px-5 py-3 text-ink-soft">{validade}</td>
                      <td className="px-5 py-3">
                        <StatusPill tone={couponTone[status] ?? "muted"}>
                          {status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/cupons/${c.id}/editar`}
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GiftIcon size={18} className="text-volt" />
            <h2 className="font-display text-xl text-ink">Brindes & Recompensas</h2>
          </div>

          <Link
            href="/admin/cupons/brindes/novo"
            className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-3 py-1.5 text-xs text-ink hover:border-volt/60 transition-colors"
          >
            <Plus size={14} className="text-volt" />
            Novo brinde
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gifts.length === 0 ? (
            <p className="text-sm text-ink-soft col-span-2">
              Nenhum brinde cadastrado.
            </p>
          ) : (
            gifts.map((g) => {
              const condicao = g.minPurchaseValue
                ? `Compras acima de ${currency(Number(g.minPurchaseValue))}`
                : g.minLoyaltyPoints
                ? `Troca por ${g.minLoyaltyPoints} pontos`
                : g.description ?? "Disponível";

              return (
                <div
                  key={g.id}
                  className="rounded-md border border-base-line bg-base-raised p-5 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-ink font-medium">{g.name}</p>
                      {g.product && (
                        <span className="text-[10px] uppercase tracking-wider bg-base text-ink-soft px-1.5 py-0.5 rounded-sm border border-base-line">
                          {g.product.name}
                        </span>
                      )}
                      {g.category && (
                        <span className="text-[10px] uppercase tracking-wider bg-volt/10 text-volt px-1.5 py-0.5 rounded-sm border border-volt/20">
                          {g.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-soft mt-1">{condicao}</p>
                    <p className="text-xs text-volt mt-3 font-mono">
                      {g.stockQuantity} disponíveis em estoque
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/cupons/brindes/${g.id}/editar`}
                      className="text-ink-soft hover:text-ink p-1 transition-colors"
                      title="Editar brinde"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <form action={deleteGift.bind(null, g.id)}>
                      <button
                        type="submit"
                        className="text-ink-soft hover:text-alert p-1 transition-colors"
                        title="Excluir brinde"
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
