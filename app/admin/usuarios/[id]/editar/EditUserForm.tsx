"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCog, Trash2, AlertTriangle, Save } from "lucide-react";
import { updateUser, deleteUser } from "@/lib/actions";

type UserRole = "ADMIN" | "MANAGER" | "SELLER";

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    hint: "Acesso total, incluindo contas e financeiro.",
  },
  {
    value: "MANAGER",
    label: "Gerente",
    hint: "Gerencia estoque, produtos, cupons e vê financeiro.",
  },
  {
    value: "SELLER",
    label: "Vendedor",
    hint: "Registra vendas, consulta estoque e clientes.",
  },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export default function EditUserForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(user.active);
  const [role, setRole] = useState<UserRole>(user.role);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateUserWithId = updateUser.bind(null, user.id);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a conta de "${user.name}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteUser(user.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir conta.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateUserWithId}
        onSubmit={() => setLoading(true)}
        className="space-y-6"
      >
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <UserCog size={16} className="text-volt" />
              <span>Dados da conta</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="hidden"
                name="active"
                value={active ? "true" : "false"}
              />
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-base-line bg-base text-volt focus:ring-0"
              />
              <span>Conta ativa</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Nome *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={user.name}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue={user.email}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Nova senha (opcional)
              </label>
              <input
                type="password"
                name="password"
                minLength={6}
                placeholder="Deixe em branco para manter a atual"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Cargo *
              </label>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-ink-soft">
                {ROLE_OPTIONS.find((r) => r.value === role)?.hint}
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/usuarios"
            className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para usuários
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      {/* Zona de Perigo / Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir conta
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação remove o acesso da pessoa ao sistema permanentemente.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-alert/40 text-alert text-xs font-medium hover:bg-alert hover:text-base transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
        </button>
      </div>
    </div>
  );
}
