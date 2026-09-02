"use client";

import { useCallback, useState } from "react";
import { Shirt, ChevronLeft, ChevronRight, X as XIcon, ZoomIn } from "lucide-react";

export default function ProductGallery({
  images,
  name,
  esgotado = false,
}: {
  images: string[];
  name: string;
  esgotado?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const list = images.filter(Boolean);

  const prev = useCallback(() => {
    if (list.length === 0) return;
    setActive((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);

  const next = useCallback(() => {
    if (list.length === 0) return;
    setActive((i) => (i + 1) % list.length);
  }, [list.length]);

  return (
    <>
      <div className="relative w-full">
        {/* Imagem principal */}
        <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-lg border border-base-line bg-gradient-to-br from-base-line/40 to-base bg-[#14161b]">
          {list.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={list[active]}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Shirt size={96} className="text-ink-soft/30" strokeWidth={1.1} />
          )}
          {esgotado && (
            <span className="absolute right-4 top-4 rounded-sm bg-alert px-3 py-1 text-xs font-medium text-base">
              Esgotado
            </span>
          )}

          {/* Botão de ampliar */}
          {list.length > 0 && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
              title="Ampliar imagem"
            >
              <ZoomIn size={16} />
            </button>
          )}

          {/* Seta esquerda */}
          {list.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/65"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Seta direita */}
          {list.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/65"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Contador */}
          {list.length > 1 && (
            <span className="absolute bottom-4 left-4 rounded-sm bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {active + 1} / {list.length}
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {list.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {list.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                  i === active
                    ? "border-volt shadow-[0_0_0_1px_rgba(200,255,77,0.3)]"
                    : "border-base-line opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${name} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox fullscreen */}
      {fullscreen && list.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          {/* Botão fechar */}
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-5 top-5 z-50 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fechar"
          >
            <XIcon size={20} />
          </button>

          {/* Imagem */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={list[active]}
            alt={name}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          {/* Seta esquerda */}
          {list.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Seta direita */}
          {list.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Contador */}
          {list.length > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-sm bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
              {active + 1} / {list.length}
            </span>
          )}

          {/* Thumbnails no lightbox */}
          {list.length > 1 && (
            <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-2">
              {list.map((src, i) => (
                <button
                  key={`lb-${src}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    i === active
                      ? "border-volt"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
