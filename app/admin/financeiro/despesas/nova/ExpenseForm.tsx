"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign } from "lucide-react";
import { createExpense } from "@/lib/actions";

export default function ExpenseForm() {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      action={createExpense}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <DollarSign size={16} className="text-volt" />
          <span>Detalhes da Despesa</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Categoria da Despesa *
            </label>
            <select
              name="category"
              required
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            >
              <option value="RENT">Aluguel do Espaço / Loja</option>
              <option value="MARKETING">Marketing & Anúncios</option>
              <option value="SOFTWARE">Software & Ferramentas SaaS</option>
              <option value="UTILITIES">Utilidades (Luz, Água, Internet)</option>
              <option value="SALARY">Salários & Pró-labore</option>
              <option value="LOGISTICS">Logística & Embalagens</option>
              <option value="OTHER">Outros Gastos Operacionais</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Valor (R$) *
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Descrição / Fornecedor do Serviço *
            </label>
            <input
              type="text"
              name="description"
              required
              placeholder="Ex: Anúncios Meta Ads (Instagram/Facebook), Aluguel Loja Física, etc."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Data de Vencimento *
            </label>
            <input
              type="date"
              name="dueDate"
              required
              defaultValue={today}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-center space-y-2 pt-4">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                name="paid"
                className="rounded border-base-line bg-base text-volt focus:ring-0"
              />
              <span>Marcar como já pago hoje</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                name="recurring"
                className="rounded border-base-line bg-base text-volt focus:ring-0"
              />
              <span>Despesa recorrente mensal</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/financeiro"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para financeiro
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Cadastrando..." : "Cadastrar Despesa"}
        </button>
      </div>
    </form>
  );
}
