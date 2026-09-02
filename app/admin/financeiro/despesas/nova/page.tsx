import PageHeader from "@/components/PageHeader";
import ExpenseForm from "@/app/admin/financeiro/despesas/nova/ExpenseForm";

export const dynamic = "force-dynamic";

export default function NovaDespesaPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Nova Despesa"
        description="Cadastre custos operacionais, aluguel, marketing, softwares ou contas a pagar."
      />

      <ExpenseForm />
    </div>
  );
}
