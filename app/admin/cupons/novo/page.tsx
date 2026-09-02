import PageHeader from "@/components/PageHeader";
import CouponForm from "./CouponForm";

export const dynamic = "force-dynamic";

export default function NovoCupomPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo Cupom de Desconto"
        description="Crie cupons com regras personalizadas: desconto fixo ou percentual, valor mínimo e data de validade."
      />

      <CouponForm />
    </div>
  );
}
