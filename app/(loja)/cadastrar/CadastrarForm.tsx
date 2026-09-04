"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { customerRegister } from "@/lib/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-volt px-4 py-2 text-sm font-medium text-base hover:bg-volt-dim disabled:opacity-50 transition-colors"
    >
      {pending ? "Criando conta..." : "Criar conta"}
    </button>
  );
}

export default function CadastrarForm() {
  const [state, formAction] = useFormState(customerRegister, null);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-md border border-base-line bg-base-raised p-6 space-y-4 text-left"
    >
      <h1 className="text-xl font-medium text-ink">Criar conta</h1>
      <p className="text-sm text-ink-soft">
        Crie sua conta para acompanhar pedidos e salvar seus produtos favoritos.
      </p>

      {state?.error && (
        <p className="rounded-sm border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-alert">
          {state.error}
        </p>
      )}

      <input
        name="name"
        type="text"
        placeholder="Nome completo"
        required
        autoComplete="name"
        className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
      />

      <input
        name="cpf"
        type="text"
        placeholder="CPF (opcional)"
        inputMode="numeric"
        maxLength={14}
        autoComplete="off"
        className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
      />

      <input
        name="password"
        type="password"
        placeholder="Senha (mín. 6 caracteres)"
        required
        minLength={6}
        autoComplete="new-password"
        className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
      />

      <SubmitButton />

      <p className="text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-volt hover:text-volt-dim">
          Entrar
        </Link>
      </p>
    </form>
  );
}
