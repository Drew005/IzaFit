import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Editar Produto: ${product.name}`}
        description="Atualize as informações do produto, preços, variações e controle de estoque."
      />

      <EditProductForm
        product={product}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
