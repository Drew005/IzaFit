import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { Image, LayoutDashboard, Upload } from "lucide-react";
import { updateStoreBranding } from "@/lib/actions";

export const dynamic = "force-dynamic";

const DEFAULT_HERO_SLIDES = [
  {
    image: "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
    alt: "IzaFit — Vista seu treino",
    href: "/produtos",
  },
  {
    image: "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
    alt: "IzaFit — Nova coleção",
    href: "/produtos?sort=new",
  },
];

export default async function ConfiguracoesPage() {
  const store = await prisma.store.findFirst();
  const currentLogo = store?.logoUrl ?? "";
  const currentSlides = store?.heroSlides ?? DEFAULT_HERO_SLIDES;
  const slidesJson = JSON.stringify(currentSlides, null, 2);

  return (
    <div className="max-w-4xl space-y-10">
      <PageHeader
        title="Configurações da Loja"
        description="Gerencie a identidade visual do site: logo e carrossel da página inicial."
      />

      <form action={updateStoreBranding} className="space-y-8" encType="multipart/form-data">
        {/* --- Logo --- */}
        <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-6">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <Image size={18} className="text-volt" />
            <span>Logo da Loja</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-medium text-ink-soft">
                Upload da Logo (SVG, PNG, JPG, WEBP — máx. 10 MB)
              </label>
              <input
                type="file"
                name="logoFile"
                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink file:mr-4 file:rounded-sm file:border-0 file:bg-volt file:text-base file:px-4 file:py-2 hover:file:bg-volt-dim"
              />
              <p className="text-xs text-ink-soft">
                Recomendado: SVG transparente ou PNG com fundo transparente, altura ~40px.
              </p>
            </div>

            <div className="flex flex-col items-center">
              {currentLogo ? (
                <div className="relative w-32 h-20 rounded-md border border-base-line bg-base overflow-hidden">
                  <img
                    src={currentLogo}
                    alt="Logo atual"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative w-32 h-20 rounded-md border border-dashed border-base-line bg-base flex items-center justify-center">
                  <span className="text-xs text-ink-soft">Sem logo</span>
                </div>
              )}
              <p className="mt-2 text-xs text-ink-soft text-center">Preview atual</p>
            </div>
          </div>
        </section>

        {/* --- Hero Carousel --- */}
        <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-6">
          <div className="flex items-center gap-2 text-ink font-medium text-sm">
            <LayoutDashboard size={18} className="text-volt" />
            <span>Carrossel do Hero (Banner Principal)</span>
          </div>

          <p className="text-xs text-ink-soft">
            Insira um array JSON de slides. Cada slide precisa de:
            <code className="bg-base px-1 rounded font-mono text-[11px]">image</code> (obrigatório),
            <code className="bg-base px-1 rounded font-mono text-[11px]">alt</code> (obrigatório) e
            <code className="bg-base px-1 rounded font-mono text-[11px]">href</code> (opcional).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                JSON dos Slides
              </label>
              <textarea
                name="heroSlides"
                required
                defaultValue={slidesJson}
                rows={20}
                spellCheck={false}
                className="w-full font-mono text-[12px] rounded-sm border border-base-line bg-base px-3 py-2 text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none resize-none"
                placeholder={JSON.stringify(DEFAULT_HERO_SLIDES, null, 2)}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-md border border-base-line bg-base p-4">
                <p className="text-xs font-medium text-ink-soft mb-2">Preview do JSON</p>
                <pre className="text-[11px] text-ink-soft overflow-auto max-h-64 bg-base-raised p-2 rounded-sm">
                  {slidesJson}
                </pre>
              </div>

              <div className="rounded-md border border-volt/20 bg-volt/5 p-4 text-xs text-ink-soft">
                <Upload size={14} className="text-volt inline mr-1" />
                <strong>Dica:</strong> Use URLs do Supabase Storage (uploadadas em Produtos) ou URLs
                externas confiáveis (CDN). A imagem deve ter proporção ~16:9 (ex.: 1920x1080).
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim transition-colors"
                >
                  <Upload size={16} />
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}