import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import OrderForm from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function NovaVendaPage() {
  const [customers, variants, coupons, gifts] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        cpf: true,
        loyaltyPoints: true,
      },
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
    prisma.coupon.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
    }),
    prisma.gift.findMany({
      where: { active: true, stockQuantity: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nova Venda"
        description="Registre uma venda com baixa imediata no estoque, acúmulo de pontos e aplicação de cupom."
      />

      <OrderForm
        customers={customers}
        variants={variants}
        coupons={coupons}
        gifts={gifts}
      />
    </div>
  );
}
