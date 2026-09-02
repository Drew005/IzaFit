import PageHeader from "@/components/PageHeader";
import CustomerForm from "./CustomerForm";

export const dynamic = "force-dynamic";

export default function NovoClientePage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo Cliente"
        description="Cadastre clientes com dados para contato, endereço de entrega e histórico de fidelidade."
      />

      <CustomerForm />
    </div>
  );
}
