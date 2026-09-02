import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import PurchaseForm from "./PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NovaCompraPage() {
  const [suppliers, variants] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { active: true },
      include: {
        product: true,
        attributeValues: {
          include: { attributeValue: true },
        },
      },
      orderBy: { product: { name: "asc" } },
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nova Compra de Mercadoria"
        description="Registre pedidos com fornecedores. Quando marcada como recebida, o estoque e custo médio são atualizados automaticamente."
      />

      <PurchaseForm suppliers={suppliers} variants={variants} />
    </div>
  );
}
