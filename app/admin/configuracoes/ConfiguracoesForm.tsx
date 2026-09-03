"use client";

import { useState } from "react";
import {
  ImagePlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  LayoutDashboard,
  ImageIcon,
} from "lucide-react";
import { updateStoreBranding } from "@/lib/actions";

export interface SlideData {
  id: string;
  image: string;
  alt: string;
  href?: string;
  previewUrl?: string;
  file?: File | null;
}

interface ConfiguracoesFormProps {
  initialLogoUrl?: string | null;
  initialSlides: Array<{
    image: string;
    alt: string;
    href?: string;
  }>;
}

export default function ConfiguracoesForm({
  initialLogoUrl,
  initialSlides,
}: ConfiguracoesFormProps) {
  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl || null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Slides state
  const [slides, setSlides] = useState<SlideData[]>(() =>
    initialSlides.length > 0
      ? initialSlides.map((s, idx) => ({
          id: `slide-${idx}-${Date.now()}`,
          image: s.image,
          alt: s.alt,
          href: s.href || "",
          previewUrl: s.image,
        }))
      : [
          {
            id: `slide-0-${Date.now()}`,
            image: "",
            alt: "IzaFit — Vista seu treino",
            href: "/produtos",
            previewUrl: "",
          },
        ]
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readFileAsDataUrl(file);
      setLogoPreview(url);
      setRemoveLogo(false);
    } catch (err) {
      console.error("Erro ao ler arquivo de logo:", err);
    }
  }

  function handleResetLogo() {
    setLogoPreview(null);
    setRemoveLogo(true);
  }

  async function handleSlideFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const preview = await readFileAsDataUrl(file);
      setSlides((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                file,
                previewUrl: preview,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Erro ao carregar preview do banner:", err);
    }
  }

  function handleSlideUrlChange(index: number, url: string) {
    setSlides((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              image: url,
              previewUrl: url,
              file: null,
            }
          : s
      )
    );
  }

  function handleSlideAltChange(index: number, alt: string) {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, alt } : s))
    );
  }

  function handleSlideHrefChange(index: number, href: string) {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, href } : s))
    );
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        image: "",
        alt: `IzaFit — Banner ${prev.length + 1}`,
        href: "/produtos",
        previewUrl: "",
      },
    ]);
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) {
      // Se for o último, apenas limpa
      setSlides([
        {
          id: `slide-${Date.now()}`,
          image: "",
          alt: "IzaFit — Novo banner",
          href: "/produtos",
          previewUrl: "",
        },
      ]);
      return;
    }
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlide(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === slides.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setSaving(true);
    setSavedSuccess(false);
  }

  return (
    <form
      action={updateStoreBranding}
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="space-y-10"
    >
      {/* ========================================================================= */}
      {/* 1. LOGO DA LOJA */}
      {/* ========================================================================= */}
      <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink font-medium text-base">
            <ImageIcon size={20} className="text-volt" />
            <span>Logo da Loja</span>
          </div>
          {logoPreview && (
            <button
              type="button"
              onClick={handleResetLogo}
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-alert transition-colors"
            >
              <RotateCcw size={13} />
              Restaurar logo padrão
            </button>
          )}
        </div>

        {removeLogo && <input type="hidden" name="removeLogo" value="true" />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-medium text-ink-soft">
              Enviar nova logo (SVG, PNG, JPG, WebP — até 10 MB)
            </label>
            <input
              type="file"
              name="logoFile"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink file:mr-4 file:rounded-sm file:border-0 file:bg-volt file:text-base file:px-4 file:py-2 hover:file:bg-volt-dim cursor-pointer"
            />
            <p className="text-xs text-ink-soft">
              O arquivo será enviado diretamente para o <strong>Supabase Storage</strong>.
              Recomendado: imagem com fundo transparente e proporção horizontal.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-full h-24 rounded-md border border-base-line bg-base flex items-center justify-center p-3 overflow-hidden">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Preview da Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-display text-lg font-bold text-volt">IzaFit</span>
                  <span className="text-[10px] text-ink-soft">Logo padrão (SVG)</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-soft text-center">
              {logoPreview ? "Preview da logo personalizada" : "Logo padrão ativa"}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CARROSSEL DO HERO (BANNER PRINCIPAL) */}
      {/* ========================================================================= */}
      <section className="rounded-md border border-base-line bg-base-raised p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-ink font-medium text-base">
              <LayoutDashboard size={20} className="text-volt" />
              <span>Banners do Hero (Carrossel Principal)</span>
            </div>
            <p className="text-xs text-ink-soft">
              Faça upload de fotos para os banners que aparecem no topo da página inicial.
              As imagens são salvas automaticamente no <strong>Supabase Storage</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={addSlide}
            className="inline-flex items-center gap-2 rounded-sm bg-volt text-base px-3.5 py-2 text-xs font-semibold hover:bg-volt-dim transition-colors"
          >
            <Plus size={15} />
            Adicionar Banner
          </button>
        </div>

        {/* Lista de Slides */}
        <div className="space-y-6">
          {slides.map((slide, index) => {
            const hasPreview = Boolean(slide.previewUrl || slide.image);

            return (
              <div
                key={slide.id}
                className="rounded-md border border-base-line bg-base p-5 space-y-5 transition-all hover:border-base-line/80"
              >
                {/* Cabeçalho do Slide */}
                <div className="flex items-center justify-between border-b border-base-line/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded bg-volt/10 text-xs font-bold text-volt">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-ink">
                      Banner #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botões de reordenação */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSlide(index, "up")}
                      className="grid h-7 w-7 place-items-center rounded border border-base-line text-ink-soft hover:text-ink hover:border-volt/60 disabled:opacity-30 disabled:hover:border-base-line transition-colors"
                      title="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, "down")}
                      className="grid h-7 w-7 place-items-center rounded border border-base-line text-ink-soft hover:text-ink hover:border-volt/60 disabled:opacity-30 disabled:hover:border-base-line transition-colors"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(index)}
                      className="grid h-7 w-7 place-items-center rounded border border-base-line text-ink-soft hover:text-alert hover:border-alert transition-colors ml-2"
                      title="Excluir banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Campos Hidden para identificação no Server Action */}
                <input type="hidden" name="slideIndex" value={index} />
                <input
                  type="hidden"
                  name={`slideUrl_${index}`}
                  value={slide.image || ""}
                />

                {/* Conteúdo do Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Preview da Imagem */}
                  <div className="lg:col-span-5 space-y-2">
                    <p className="text-xs font-medium text-ink-soft">
                      Imagem do Banner (Proporção ~16:9 widescreen)
                    </p>

                    <div className="relative aspect-[16/9] w-full rounded-md border border-base-line bg-base-raised overflow-hidden flex items-center justify-center">
                      {hasPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.previewUrl || slide.image}
                            alt={slide.alt || `Banner ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                            <span className="text-[11px] text-white/90 truncate font-medium">
                              {slide.alt || "Sem legenda"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-ink-soft">
                          <ImagePlus size={28} className="mb-2 text-ink-soft/50" />
                          <span className="text-xs font-medium">Nenhuma foto selecionada</span>
                          <span className="text-[10px] text-ink-soft/70">
                            Faça upload abaixo ou cole uma URL
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload e Configurações do Slide */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Upload direto para o Supabase Storage */}
                    <div>
                      <label className="block text-xs font-medium text-ink-soft mb-1.5">
                        <Upload size={13} className="inline mr-1 text-volt" />
                        Subir arquivo do computador para o Supabase
                      </label>
                      <input
                        type="file"
                        name={`slideFile_${index}`}
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={(e) => handleSlideFileChange(index, e)}
                        className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-xs text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-volt file:text-base file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-volt-dim cursor-pointer"
                      />
                      <p className="mt-1 text-[11px] text-ink-soft">
                        Aceita JPG, PNG, WebP, GIF, AVIF (máx. 10 MB).
                      </p>
                    </div>

                    {/* URL Externa / Atual */}
                    <div>
                      <label className="block text-xs font-medium text-ink-soft mb-1.5">
                        Ou utilize uma URL de imagem direta
                      </label>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/banner.jpg"
                        value={slide.image}
                        onChange={(e) => handleSlideUrlChange(index, e.target.value)}
                        className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Texto Alt / Descrição */}
                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1.5">
                          <Sparkles size={12} className="inline mr-1 text-volt" />
                          Título / Texto Acessível (Alt) *
                        </label>
                        <input
                          type="text"
                          name={`slideAlt_${index}`}
                          required
                          value={slide.alt}
                          onChange={(e) => handleSlideAltChange(index, e.target.value)}
                          placeholder="Ex: IzaFit — Vista seu treino"
                          className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
                        />
                      </div>

                      {/* Link de Destino (Href) */}
                      <div>
                        <label className="block text-xs font-medium text-ink-soft mb-1.5">
                          <LinkIcon size={12} className="inline mr-1 text-volt" />
                          Link de Destino (Opcional)
                        </label>
                        <input
                          type="text"
                          name={`slideHref_${index}`}
                          value={slide.href || ""}
                          onChange={(e) => handleSlideHrefChange(index, e.target.value)}
                          placeholder="Ex: /produtos ou /produtos?sort=best"
                          className="w-full rounded-sm border border-base-line bg-base-raised px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-volt focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão para adicionar mais um banner */}
        <div className="pt-2">
          <button
            type="button"
            onClick={addSlide}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-base-line py-3 text-xs font-medium text-ink-soft hover:border-volt/60 hover:text-ink transition-colors"
          >
            <Plus size={15} className="text-volt" />
            Adicionar outro slide ao carrossel
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTÃO DE SALVAR */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-base-line">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-sm bg-volt text-base px-8 py-3 text-sm font-semibold hover:bg-volt-dim disabled:opacity-50 transition-all shadow-md"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-base border-t-transparent" />
              <span>Enviando para o Supabase...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
