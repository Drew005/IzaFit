import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import GiftForm from "./GiftForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface EditarBrindePageProps {
  params: {
    id: string;
  };
}

export default async function EditarBrindePage({ params }: EditarBrindePageProps) {
  const [gift, products, categories] = await Promise.all([
    prisma.gift.findUnique({
      where: { id: params.id },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!gift) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar Brinde: ${gift.name}`}
        description="Atualize as informações e condições de disponibilidade do brinde."
      />

      <GiftForm
        gift={gift}
        products={products}
        categories={categories}
      />
    </div>
  );
}
