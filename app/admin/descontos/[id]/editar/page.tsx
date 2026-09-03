import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditDiscountForm from "./EditDiscountForm";

export const dynamic = "force-dynamic";

export default async function EditDescontoPage({
  params,
}: {
  params: { id: string };
}) {
  const discount = await prisma.discount.findUnique({
    where: { id: params.id },
  });

  if (!discount) {
    notFound();
  }

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
        title={`Editar Desconto: ${discount.name}`}
        description="Ajuste o alvo, o valor percentual ou fixo, a validade ou desative o desconto."
      />

      <EditDiscountForm
        discount={discount}
        products={products}
        categories={categories}
        variants={variants}
      />
    </div>
  );
}
