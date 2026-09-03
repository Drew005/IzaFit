import { prisma } from "@/lib/prisma";

export type StoreHeroSlide = {
  image: string;
  alt: string;
  href?: string;
};

export const DEFAULT_LOGO_URL = "/izafitlogo.svg";

export const DEFAULT_HERO_SLIDES: StoreHeroSlide[] = [
  {
    image:
      "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
    alt: "IzaFit — Vista seu treino",
    href: "/produtos",
  },
  {
    image:
      "https://cdn.avvi.com.br//app-avvi/assets/images/dinamica/album/1/1-banner-desktop-190826-a9fb26.png",
    alt: "IzaFit — Nova coleção",
    href: "/produtos?sort=new",
  },
];

function parseSlides(value: unknown): StoreHeroSlide[] {
  if (!Array.isArray(value)) return DEFAULT_HERO_SLIDES;

  const slides = value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).image === "string"
  ).map((item, index) => ({
    image: item.image as string,
    alt: typeof item.alt === "string" && item.alt.trim() ? item.alt : `Banner ${index + 1}`,
    ...(typeof item.href === "string" && item.href.trim() ? { href: item.href } : {}),
  }));

  return slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
}

export async function getStoreBranding() {
  const store = await prisma.store.findFirst({
    select: { logoUrl: true, heroSlides: true },
  });

  return {
    logoUrl: store?.logoUrl || DEFAULT_LOGO_URL,
    heroSlides: parseSlides(store?.heroSlides),
  };
}
