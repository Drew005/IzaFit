"use client";

import { useState } from "react";
import { MapPin, Plus, Edit2, Trash2, Star } from "lucide-react";
import { deleteAddress, setDefaultAddress } from "@/lib/customer-addresses";
import AddressForm from "./AddressForm";

type Address = {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
};

function formatCep(cep: string) {
  const c = cep.replace(/\D/g, "");
  if (c.length === 8) return `${c.slice(0, 5)}-${c.slice(5)}`;
  return cep;
}

function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-md border border-volt/40 bg-base p-4">
        <AddressForm address={address} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-base-line bg-base-raised p-4">
      <div className="flex items-start gap-3">
        <MapPin size={16} className="mt-0.5 shrink-0 text-ink-soft/50" />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink">
              {address.label ?? "Endereço"}
            </p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-volt/10 px-2 py-0.5 text-[11px] font-medium text-volt">
                <Star size={10} fill="currentColor" /> Principal
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {address.street}, {address.number}
            {address.complement ? ` — ${address.complement}` : ""}
          </p>
          <p className="text-sm text-ink-soft">
            {address.district} — {address.city}/{address.state}
          </p>
          <p className="text-xs text-ink-soft/60">CEP: {formatCep(address.zipCode)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!address.isDefault && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="addressId" value={address.id} />
            <button
              type="submit"
              title="Tornar principal"
              className="rounded-sm border border-base-line p-1.5 text-ink-soft transition-colors hover:border-volt/60 hover:text-volt"
            >
              <Star size={14} />
            </button>
          </form>
        )}
        <button
          onClick={() => setEditing(true)}
          title="Editar"
          className="rounded-sm border border-base-line p-1.5 text-ink-soft transition-colors hover:border-volt/60 hover:text-volt"
        >
          <Edit2 size={14} />
        </button>
        <form
          action={deleteAddress}
          onSubmit={(e) => {
            if (!confirm("Remover este endereço?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="addressId" value={address.id} />
          <button
            type="submit"
            title="Excluir"
            className="rounded-sm border border-base-line p-1.5 text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
          >
            <Trash2 size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AddressManager({
  addresses,
}: {
  addresses: Address[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-md border border-base-line bg-base-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
          <MapPin size={15} className="text-volt" />
          Meus endereços
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-sm border border-volt/40 bg-volt/10 px-3 py-1.5 text-xs font-medium text-volt transition-colors hover:bg-volt/20"
          >
            <Plus size={14} />
            Adicionar
          </button>
        )}
      </div>

      {addresses.length === 0 && !adding && (
        <p className="mt-4 text-sm text-ink-soft">
          Você ainda não cadastrou nenhum endereço.
        </p>
      )}

      {adding && (
        <div className="mt-4 rounded-md border border-volt/40 bg-base p-4">
          <AddressForm onCancel={() => setAdding(false)} />
        </div>
      )}

      {addresses.length > 0 && (
        <div className="mt-4 space-y-3">
          {addresses.map((a) => (
            <AddressCard key={a.id} address={a} />
          ))}
        </div>
      )}
    </div>
  );
}
