import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import StockMovementForm from "./StockMovementForm";

export const dynamic = "force-dynamic";

export default async function NovaMovimentacaoPage() {
  const variants = await prisma.productVariant.findMany({
    where: { active: true },
    include: {
      product: true,
      attributeValues: {
        include: { attributeValue: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Nova Movimentação de Estoque"
        description="Registre entradas manuais, perdas, avarias ou acertos de contagem com rastreabilidade total."
      />

      <StockMovementForm variants={variants} />
    </div>
  );
}
