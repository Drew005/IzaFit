import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditUserForm from "./EditUserForm";

export const dynamic = "force-dynamic";

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Editar conta: ${user.name}`}
        description="Atualize nome, email, cargo, status ou a senha do usuário."
      />

      <EditUserForm user={user} />
    </div>
  );
}
