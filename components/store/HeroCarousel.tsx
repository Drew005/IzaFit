"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  image: string;
  alt: string;
  href?: string;
};

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[activeSlide];
  const content = (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden bg-base-raised md:min-h-[520px]">
      {slides.map((item, index) => (
        <img
          key={`${item.image}-${index}`}
          src={item.image}
          alt={item.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/25" />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagem anterior"
            onClick={(event) => {
              event.preventDefault();
              setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
            }}
            className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Próxima imagem"
            onClick={(event) => {
              event.preventDefault();
              setActiveSlide((current) => (current + 1) % slides.length);
            }}
            className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/60"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((item, index) => (
              <button
                key={`${item.image}-indicator-${index}`}
                type="button"
                aria-label={`Ir para imagem ${index + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  setActiveSlide(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide ? "w-7 bg-volt" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="border-b border-base-line">
      {slide.href ? (
        <a href={slide.href} aria-label={slide.alt} className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </section>
  );
}
