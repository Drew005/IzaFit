import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import CategoryForm from "@/app/admin/produtos/categorias/nova/CategoryForm";

export const dynamic = "force-dynamic";

export default async function NovaCategoriaPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nova Categoria"
        description="Cadastre uma nova linha de produtos (ex: Leggings, Tops, Suplementos, Acessórios)."
      />

      <CategoryForm parentCategories={categories} />
    </div>
  );
}
