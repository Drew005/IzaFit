"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, MapPin, ShoppingBag, Trash2, AlertTriangle } from "lucide-react";
import { updateCustomer, deleteCustomer } from "@/lib/actions";

interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  total: any;
  status: string;
  createdAt: Date;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  loyaltyPoints: number;
  notes: string | null;
  addresses: Address[];
  orders: Order[];
}

function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateCustomerWithId = updateCustomer.bind(null, customer.id);

  async function handleDelete() {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir este cliente? Se ele tiver pedidos vinculados, a exclusão pode falhar por integridade relacional."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteCustomer(customer.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir cliente.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateCustomerWithId}
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
                defaultValue={customer.name}
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
                defaultValue={customer.email || ""}
                placeholder="cliente@exemplo.com"
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
                defaultValue={customer.phone || ""}
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
                defaultValue={customer.cpf || ""}
                placeholder="000.000.000-00"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Pontos de Fidelidade
              </label>
              <input
                type="number"
                name="loyaltyPoints"
                defaultValue={customer.loyaltyPoints}
                min="0"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Observações
              </label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={customer.notes || ""}
                placeholder="Preferências, tamanhos habituais..."
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Endereços Cadastrados */}
        {customer.addresses.length > 0 && (
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <MapPin size={16} className="text-volt" />
              <span>Endereço(s) Cadastrado(s)</span>
            </div>

            <div className="space-y-2">
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3 rounded-sm border border-base-line bg-base text-xs text-ink space-y-1"
                >
                  <p className="font-medium">
                    {addr.street}, {addr.number}{" "}
                    {addr.complement ? `- ${addr.complement}` : ""}
                  </p>
                  <p className="text-ink-soft">
                    {addr.district} — {addr.city} / {addr.state} (CEP: {addr.zipCode})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Recentes */}
        {customer.orders.length > 0 && (
          <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-3">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <ShoppingBag size={16} className="text-volt" />
              <span>Últimas Compras</span>
            </div>

            <div className="space-y-2">
              {customer.orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-sm border border-base-line bg-base text-xs text-ink"
                >
                  <div>
                    <span className="font-mono text-ink-soft">
                      PD-{o.id.slice(-4).toUpperCase()}
                    </span>
                    <span className="ml-3 text-ink-soft">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(o.createdAt))}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{currency(Number(o.total))}</span>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] bg-base-raised border border-base-line text-ink-soft">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir cliente
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação removerá o cadastro do cliente e seus endereços vinculados.
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
