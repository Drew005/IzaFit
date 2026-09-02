"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Trash2, AlertTriangle } from "lucide-react";
import { updateExpense, deleteExpense } from "@/lib/actions";

interface Expense {
  id: string;
  category: any;
  description: string;
  amount: any;
  dueDate: Date;
  paidAt: Date | null;
  recurring: boolean;
}

export default function EditExpenseForm({ expense }: { expense: Expense }) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateExpenseWithId = updateExpense.bind(null, expense.id);

  const defaultDate = expense.dueDate
    ? new Date(expense.dueDate).toISOString().split("T")[0]
    : "";

  async function handleDelete() {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir despesa.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateExpenseWithId}
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
                defaultValue={expense.category}
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
                defaultValue={Number(expense.amount)}
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
                defaultValue={expense.description}
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
                defaultValue={defaultDate}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-4">
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  name="paid"
                  defaultChecked={Boolean(expense.paidAt)}
                  className="rounded border-base-line bg-base text-volt focus:ring-0"
                />
                <span>Despesa Quitada / Paga</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  name="recurring"
                  defaultChecked={expense.recurring}
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
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir despesa
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação excluirá permanentemente o lançamento da despesa do histórico financeiro.
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
