import PageHeader from "@/components/PageHeader";
import SupplierForm from "./SupplierForm";

export const dynamic = "force-dynamic";

export default function NovoFornecedorPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo Fornecedor"
        description="Cadastre fabricantes, confecções ou distribuidores para compras de mercadoria."
      />

      <SupplierForm />
    </div>
  );
}
