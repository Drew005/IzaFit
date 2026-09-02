"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Preview = {
  url: string;
  file?: File;
  existing?: boolean;
};

// Seletor de fotos do produto (capa + galeria) com preview.
// - Campo "image": 1 arquivo, vira a capa.
// - Campo "images": múltiplos arquivos, entram na galeria.
// - Fotos existentes podem ser removidas durante a edição.
export default function ProductImageUpload({
  name = "images",
  coverName = "image",
  existing = [],
}: {
  name?: string;
  coverName?: string;
  existing?: string[];
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const existingImages = Array.from(new Set(existing.filter(Boolean)));

  const [coverPreview, setCoverPreview] = useState<Preview | null>(
    existingImages.length > 0
      ? { url: existingImages[0], existing: true }
      : null
  );
  const [galleryPreviews, setGalleryPreviews] = useState<Preview[]>(
    existingImages.slice(1).map((url) => ({ url, existing: true }))
  );
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // Mantém no input apenas os arquivos novos que continuam visíveis no preview.
  // Isso permite selecionar fotos em mais de uma etapa sem perder as anteriores.
  useEffect(() => {
    if (!galleryInput.current || typeof DataTransfer === "undefined") return;

    const dataTransfer = new DataTransfer();
    galleryPreviews.forEach((preview) => {
      if (preview.file) dataTransfer.items.add(preview.file);
    });
    galleryInput.current.files = dataTransfer.files;
  }, [galleryPreviews]);

  function readFileAsPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsPreview(file);
    setCoverPreview({ url, file });
  }

  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const previews = await Promise.all(files.map(readFileAsPreview));
    setGalleryPreviews((prev) => [
      ...prev,
      ...previews.map((url, i) => ({ url, file: files[i] })),
    ]);
  }

  function markAsRemoved(url: string) {
    setRemovedImages((prev) =>
      prev.includes(url) ? prev : [...prev, url]
    );
  }

  function removeCover() {
    if (coverPreview?.existing) markAsRemoved(coverPreview.url);
    setCoverPreview(null);
    if (coverInput.current) coverInput.current.value = "";
  }

  function removeGallery(index: number) {
    const item = galleryPreviews[index];
    if (item?.existing) markAsRemoved(item.url);
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-md border border-base-line bg-base-raised p-6">
      <div className="flex items-center gap-2">
        <ImagePlus size={18} className="text-volt" />
        <div>
          <h2 className="text-base font-medium text-ink">Fotos do produto</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            A primeira foto serve como capa. Formatos: JPG, PNG, WebP.
          </p>
        </div>
      </div>

      {removedImages.map((url) => (
        <input key={url} type="hidden" name="removeImage" value={url} />
      ))}

      {/* Capa */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-ink-soft">
          Capa (imagem principal)
        </p>
        {coverPreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview.url}
              alt="Capa do produto"
              className="h-40 w-40 rounded-md border border-base-line object-cover"
            />
            <button
              type="button"
              onClick={removeCover}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-alert text-base shadow-md"
              title="Remover capa"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <label className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-base-line bg-base text-ink-soft transition-colors hover:border-volt/60 hover:text-ink">
            <ImagePlus size={22} />
            <span className="text-xs">Escolher foto</span>
            <input
              ref={coverInput}
              name={coverName}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCover}
            />
          </label>
        )}
      </div>

      {/* Galeria */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-ink-soft">
          Galeria (fotos adicionais)
        </p>
        <div className="flex flex-wrap gap-3">
          {galleryPreviews.map((preview, index) => (
            <div key={`${preview.url}-${index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={`Foto ${index + 2}`}
                className="h-24 w-24 rounded-md border border-base-line object-cover"
              />
              <button
                type="button"
                onClick={() => removeGallery(index)}
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-alert/90 text-base shadow-md"
                title="Remover foto"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-base-line bg-base text-ink-soft transition-colors hover:border-volt/60 hover:text-ink">
            <ImagePlus size={18} />
            <span className="text-[10px]">Adicionar</span>
            <input
              ref={galleryInput}
              name={name}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onGallery}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
