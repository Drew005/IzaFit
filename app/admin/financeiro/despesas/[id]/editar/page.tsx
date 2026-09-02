import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditExpenseForm from "@/app/admin/financeiro/despesas/[id]/editar/EditExpenseForm";

export const dynamic = "force-dynamic";

interface EditExpensePageProps {
  params: {
    id: string;
  };
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
  });

  if (!expense) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar Despesa: ${expense.description}`}
        description="Atualize o valor, vencimento, categoria ou marque a despesa como quitada."
      />

      <EditExpenseForm expense={expense} />
    </div>
  );
}
