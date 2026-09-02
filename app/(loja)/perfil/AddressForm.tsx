"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAddress, updateAddress } from "@/lib/customer-addresses";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-volt px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-volt-dim disabled:opacity-50"
    >
      {pending ? "Salvando..." : isEdit ? "Atualizar endereço" : "Salvar endereço"}
    </button>
  );
}

type AddressData = {
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

export default function AddressForm({
  address,
  onCancel,
}: {
  address?: AddressData;
  onCancel?: () => void;
}) {
  const isEdit = !!address;
  const action = isEdit ? updateAddress : createAddress;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="rounded-sm border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-sm border border-volt/40 bg-volt/10 px-3 py-2 text-sm text-volt">
          {state.success}
        </p>
      )}

      {isEdit && <input type="hidden" name="addressId" value={address.id} />}

      <label className="block">
        <span className="text-xs text-ink-soft">Apelido (ex: Casa, Trabalho)</span>
        <input
          name="label"
          type="text"
          defaultValue={address?.label ?? ""}
          placeholder="Casa"
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-[1fr_100px] gap-3">
        <label className="block">
          <span className="text-xs text-ink-soft">Rua / Logradouro *</span>
          <input
            name="street"
            type="text"
            defaultValue={address?.street ?? ""}
            required
            className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">Número *</span>
          <input
            name="number"
            type="text"
            defaultValue={address?.number ?? ""}
            required
            className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-ink-soft">Complemento</span>
        <input
          name="complement"
          type="text"
          defaultValue={address?.complement ?? ""}
          placeholder="Apto 101, Bloco B..."
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs text-ink-soft">Bairro *</span>
        <input
          name="district"
          type="text"
          defaultValue={address?.district ?? ""}
          required
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-[1fr_70px_100px] gap-3">
        <label className="block">
          <span className="text-xs text-ink-soft">Cidade *</span>
          <input
            name="city"
            type="text"
            defaultValue={address?.city ?? ""}
            required
            className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">UF *</span>
          <select
            name="state"
            defaultValue={address?.state ?? ""}
            required
            className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
          >
            <option value="">--</option>
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">CEP *</span>
          <input
            name="zipCode"
            type="text"
            inputMode="numeric"
            maxLength={8}
            defaultValue={address?.zipCode?.replace(/\D/g, "") ?? ""}
            required
            placeholder="00000000"
            className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 pt-1">
        <input
          name="isDefault"
          type="checkbox"
          defaultChecked={address?.isDefault ?? false}
          className="rounded-sm border-base-line bg-base text-volt focus:ring-volt"
        />
        <span className="text-xs text-ink-soft">Usar como endereço principal</span>
      </label>

      <div className="flex gap-2 pt-2">
        <SubmitButton isEdit={isEdit} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-base-line px-4 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
