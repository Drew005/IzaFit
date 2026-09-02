"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, MapPin } from "lucide-react";
import { createCustomer } from "@/lib/actions";

export default function CustomerForm() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={createCustomer}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      {/* Dados Pessoais */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <User size={16} className="text-volt" />
          <span>Dados Pessoais & Fidelidade</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Nome completo *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Mariana Costa"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              placeholder="mariana@exemplo.com"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              name="phone"
              placeholder="(11) 98765-4321"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              CPF
            </label>
            <input
              type="text"
              name="cpf"
              placeholder="000.000.000-00"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Pontos de Fidelidade Iniciais
            </label>
            <input
              type="number"
              name="loyaltyPoints"
              defaultValue="0"
              min="0"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Observações / Preferências
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Preferência de tamanho, estilo de treino, observações..."
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <MapPin size={16} className="text-volt" />
          <span>Endereço Principal (Opcional)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Rua / Avenida
            </label>
            <input
              type="text"
              name="street"
              placeholder="Rua das Acácias"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Número
            </label>
            <input
              type="text"
              name="number"
              placeholder="123"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Complemento / Apto
            </label>
            <input
              type="text"
              name="complement"
              placeholder="Apto 42"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Bairro
            </label>
            <input
              type="text"
              name="district"
              placeholder="Jardins"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              CEP
            </label>
            <input
              type="text"
              name="zipCode"
              placeholder="01234-567"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Cidade
            </label>
            <input
              type="text"
              name="city"
              placeholder="São Paulo"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Estado (UF)
            </label>
            <input
              type="text"
              name="state"
              placeholder="SP"
              maxLength={2}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/clientes"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para clientes
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando cliente..." : "Cadastrar Cliente"}
        </button>
      </div>
    </form>
  );
}
