import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Novo Produto"
        description="Cadastre um produto e suas variações vendáveis (tamanhos, cores ou variações únicas)."
      />

      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
