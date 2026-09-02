"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/store/FavoritesProvider";

export default function FavoriteButton({
  productId,
  name,
  imageUrl,
  price,
}: {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
}) {
  const { isFavorite, toggle } = useFavorites();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ id: productId, name, imageUrl, price });
      }}
      className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-sm backdrop-blur transition-colors ${
        isFavorite(productId)
          ? "bg-alert text-base"
          : "bg-base/90 text-ink-soft hover:text-alert"
      }`}
      title={isFavorite(productId) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-label={isFavorite(productId) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        size={16}
        fill={isFavorite(productId) ? "currentColor" : "none"}
      />
    </button>
  );
}
