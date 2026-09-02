import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditCustomerForm from "./EditCustomerForm";

export const dynamic = "force-dynamic";

interface EditCustomerPageProps {
  params: {
    id: string;
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      addresses: true,
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar Cliente: ${customer.name}`}
        description="Atualize dados cadastrais, pontos acumulados e histórico de fidelidade."
      />

      <EditCustomerForm customer={customer} />
    </div>
  );
}
