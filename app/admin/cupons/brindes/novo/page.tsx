import PageHeader from "@/components/PageHeader";
import GiftForm from "./GiftForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NovoBrindePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo Brinde / Recompensa"
        description="Cadastre brindes para premiar compras de alto valor ou permitir resgate por pontos de fidelidade."
      />

      <GiftForm products={products} categories={categories} />
    </div>
  );
}
