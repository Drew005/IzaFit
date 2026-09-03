import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import DiscountForm from "./DiscountForm";

export const dynamic = "force-dynamic";

export default async function NovoDescontoPage() {
  const [products, categories, variants] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.productVariant.findMany({
      where: { active: true },
      orderBy: { sku: "asc" },
      select: {
        id: true,
        sku: true,
        product: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo Desconto"
        description="Defina um desconto automático para um produto, categoria ou variação específica."
      />

      <DiscountForm products={products} categories={categories} variants={variants} />
    </div>
  );
}
