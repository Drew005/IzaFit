"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type FavoriteItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
};

type FavoritesCtx = {
  items: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggle: (item: FavoriteItem) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesCtx | null>(null);
const KEY = "izafit_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const isFavorite = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, item];
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ items, isFavorite, toggle, count: items.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
