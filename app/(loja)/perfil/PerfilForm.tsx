"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfile } from "@/lib/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-sm bg-volt px-4 py-2 text-sm font-medium text-base transition-colors hover:bg-volt-dim disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}

export default function PerfilForm({
  name,
  phone,
  email,
  cpf,
}: {
  name: string;
  phone: string;
  email: string;
  cpf: string | null;
}) {
  const [state, formAction] = useFormState(updateProfile, null);

  return (
    <form action={formAction} className="mt-4 space-y-3">
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

      <label className="block">
        <span className="text-xs text-ink-soft">Nome</span>
        <input
          name="name"
          type="text"
          defaultValue={name}
          required
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs text-ink-soft">Telefone</span>
        <input
          name="phone"
          type="text"
          defaultValue={phone}
          placeholder="(00) 00000-0000"
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs text-ink-soft">Email</span>
        <input
          type="email"
          value={email}
          disabled
          className="mt-1 w-full cursor-not-allowed rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink-soft/50 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs text-ink-soft">CPF</span>
        <input
          name="cpf"
          type="text"
          defaultValue={cpf ?? ""}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          className="mt-1 w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
        />
        <span className="mt-1 block text-[11px] text-ink-soft/60">
          Necessário para o pagamento via PIX ou cartão.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
