"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCog, Plus } from "lucide-react";
import { createUser } from "@/lib/actions";

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

export default function UserForm() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("SELLER");

  return (
    <form
      action={createUser}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <UserCog size={16} className="text-volt" />
          <span>Dados da conta</span>
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
              placeholder="Ex: Maria Souza"
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
              placeholder="email@loja.com"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Senha *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
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

        <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
          <input
            type="hidden"
            name="active"
            value="true"
          />
          <input
            type="checkbox"
            name="activeToggle"
            defaultChecked
            disabled
            className="rounded border-base-line bg-base text-volt focus:ring-0"
          />
          <span>Conta ativa (pode entrar no sistema)</span>
        </label>
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
          <Plus size={16} />
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </div>
    </form>
  );
}