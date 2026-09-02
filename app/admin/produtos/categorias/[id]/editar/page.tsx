import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditCategoryForm from "@/app/admin/produtos/categorias/[id]/editar/EditCategoryForm";

export const dynamic = "force-dynamic";

interface EditCategoryPageProps {
  params: {
    id: string;
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const [category, allCategories] = await Promise.all([
    prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { id: { not: params.id } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={`Editar Categoria: ${category.name}`}
        description="Atualize o nome, identificador ou hierarquia da categoria."
      />

      <EditCategoryForm
        category={category}
        parentCategories={allCategories}
      />
    </div>
  );
}
