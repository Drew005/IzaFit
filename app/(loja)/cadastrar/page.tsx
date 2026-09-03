import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { redirect } from "next/navigation";
import { getStoreBranding } from "@/lib/store-branding";
import CadastrarForm from "./CadastrarForm";

export default async function CadastrarPage() {
  const [customer, branding] = await Promise.all([
    getCurrentCustomer(),
    getStoreBranding(),
  ]);
  if (customer) redirect("/perfil");

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-base px-4 py-16">
      <div className="w-full max-w-sm space-y-4 text-center">
        <Link href="/" className="inline-block">
          <img src={branding.logoUrl} alt="IzaFit" className="h-8" />
        </Link>
        <CadastrarForm />
        <Link
          href="/"
          className="inline-block text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
