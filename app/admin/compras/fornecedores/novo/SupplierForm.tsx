"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { createSupplier } from "@/lib/actions";

export default function SupplierForm() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={createSupplier}
      onSubmit={() => setLoading(true)}
      className="space-y-6"
    >
      <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
        <div className="flex items-center gap-2 text-ink font-medium text-sm">
          <Truck size={16} className="text-volt" />
          <span>Informações do Fornecedor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Razão Social / Nome Fantasia *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex: Têxtil Fit Confecções Ltda"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              CNPJ
            </label>
            <input
              type="text"
              name="cnpj"
              placeholder="00.000.000/0001-00"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              Telefone / WhatsApp Comercial
            </label>
            <input
              type="text"
              name="phone"
              placeholder="(11) 3456-7890"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">
              E-mail de Pedidos
            </label>
            <input
              type="email"
              name="email"
              placeholder="vendas@fornecedor.com.br"
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/compras"
          className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para compras
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Cadastrando..." : "Cadastrar Fornecedor"}
        </button>
      </div>
    </form>
  );
}
