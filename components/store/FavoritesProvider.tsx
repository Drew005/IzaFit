"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getFavorites, toggleFavorite } from "@/lib/actions/store-sync";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function init() {
      const remoteItems = await getFavorites();
      const localRaw = localStorage.getItem(KEY);
      const localItems: FavoriteItem[] = localRaw ? JSON.parse(localRaw) : [];

      if (remoteItems.length > 0) {
        setIsLoggedIn(true);
        // Merge remote favorites (source of truth) with local
        const merged: FavoriteItem[] = remoteItems.map((f) => ({
            id: f.productId,
            name: f.product.name,
            imageUrl: f.product.imageUrl,
            price: f.product.variants.length
              ? Math.min(...f.product.variants.map((variant) => Number(variant.sellPrice)))
              : null,
        }));
        
        // Add local favorites not in remote
        for (const local of localItems) {
            if (!merged.find(i => i.id === local.id)) {
                merged.push(local);
                await toggleFavorite(local.id);
            }
        }
        setItems(merged);
      } else {
        setItems(localItems);
      }
      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const isFavorite = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback(async (item: FavoriteItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      const newItems = idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, item];
      
      if (isLoggedIn) toggleFavorite(item.id);
      
      return newItems;
    });
  }, [isLoggedIn]);

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
