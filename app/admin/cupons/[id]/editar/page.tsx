import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import EditCouponForm from "./EditCouponForm";

export const dynamic = "force-dynamic";

interface EditCouponPageProps {
  params: {
    id: string;
  };
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: params.id },
  });

  if (!coupon) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Editar Cupom: ${coupon.code}`}
        description="Ajuste o valor do desconto, regras de uso, validade ou desative o cupom."
      />

      <EditCouponForm coupon={coupon} />
    </div>
  );
}
