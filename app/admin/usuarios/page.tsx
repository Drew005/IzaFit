import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { prisma } from "@/lib/prisma";
import { Plus, Edit2, UserCog } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SELLER: "Vendedor",
};

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Usuários & Acessos"
        description="Contas da equipe, permissões por cargo (Administrador, Gerente, Vendedor) e status de acesso."
        action={
          <Link
            href="/admin/usuarios/novo"
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-4 py-2 text-sm font-medium hover:bg-volt-dim transition-colors"
          >
            <Plus size={16} />
            Nova conta
          </Link>
        }
      />

      <div className="rounded-md border border-base-line bg-base-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="text-left text-xs text-ink-soft border-b border-base-line">
                <th className="px-5 py-3 font-normal">Usuário</th>
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Cargo</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Entrou em</th>
                <th className="px-5 py-3 font-normal text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-soft">
                    Nenhum conta cadastrada.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-base-line/60 last:border-0 hover:bg-base/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/usuarios/${u.id}/editar`}
                        className="flex items-center gap-3 hover:text-volt transition-colors"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-base-line bg-base">
                          <UserCog size={18} className="text-ink-soft/40" />
                        </span>
                        <span className="font-medium text-ink">{u.name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={u.role === "ADMIN" ? "positive" : u.role === "MANAGER" ? "neutral" : "muted"}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill tone={u.active ? "positive" : "warning"}>
                        {u.active ? "Ativo" : "Inativo"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {new Intl.DateTimeFormat("pt-BR").format(u.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/usuarios/${u.id}/editar`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-base-line bg-base text-xs text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
                      >
                        <Edit2 size={13} />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}