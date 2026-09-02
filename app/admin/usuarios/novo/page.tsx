import PageHeader from "@/components/PageHeader";
import UserForm from "./UserForm";

export const dynamic = "force-dynamic";

export default function NovoUsuarioPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nova conta de acesso"
        description="Crie uma conta para um membro da equipe e defina o cargo e o status."
      />

      <UserForm />
    </div>
  );
}