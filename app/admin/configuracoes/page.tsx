import PageHeader from "@/components/PageHeader";
import { getStoreBranding } from "@/lib/store-branding";
import ConfiguracoesForm from "./ConfiguracoesForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const branding = await getStoreBranding();

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Configurações da Loja"
        description="Gerencie a identidade visual do site: envie sua logo e faça upload das fotos dos banners do carrossel principal direto para o Supabase Storage."
      />

      <ConfiguracoesForm
        initialLogoUrl={branding.logoUrl === "/izafitlogo.svg" ? null : branding.logoUrl}
        initialSlides={branding.heroSlides}
      />
    </div>
  );
}
