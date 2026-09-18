"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCart, saveCartItem, removeCartItem } from "@/lib/actions/store-sync";

export type CartItem = {
  key: string; // variantId
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  qty: number;
  maxStock: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartCtx | null>(null);
const KEY = "izafit_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hydrate from localStorage on mount and sync with DB
  useEffect(() => {
    async function init() {
      const remoteItems = await getCart();
      const localRaw = localStorage.getItem(KEY);
      const localItems: CartItem[] = localRaw ? JSON.parse(localRaw) : [];

      if (remoteItems.length > 0) {
        setIsLoggedIn(true);
        // Merge strategy: remote is source of truth? 
        // Let's assume for now we merge remote items with local items,
        // and if both exist, we prioritize remote or sum them?
        // Simple merge: remoteItems are persisted, so they are the baseline.
        
        // This part needs careful design.
        const merged = [...remoteItems.map(ri => ({
            key: ri.variantId,
            productId: ri.variant.productId,
            variantId: ri.variantId,
            name: ri.variant.product.name,
            sku: ri.variant.sku,
            imageUrl: ri.variant.product.imageUrl,
            price: Number(ri.variant.sellPrice),
            qty: ri.quantity,
            maxStock: ri.variant.stockQuantity
        }))];
        
        // Add local items that are not in remote
        for (const local of localItems) {
            const idx = merged.findIndex(i => i.key === local.key);
            if (idx === -1) {
                merged.push(local);
                // Also save to DB
                await saveCartItem(local.variantId, local.qty);
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

  // Persist to localStorage
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback(async (item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === item.key);
      let newItems;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Math.min(copy[idx].qty + qty, copy[idx].maxStock) };
        newItems = copy;
      } else {
        newItems = [...prev, { ...item, qty: Math.min(qty, item.maxStock) }];
      }
      
      if (isLoggedIn) {
        const updatedItem = newItems.find(i => i.key === item.key);
        if (updatedItem) saveCartItem(item.variantId, updatedItem.qty);
      }
      return newItems;
    });
  }, [isLoggedIn]);

  const remove = useCallback(async (key: string) => {
    setItems((prev) => {
        const newItems = prev.filter((i) => i.key !== key);
        if (isLoggedIn) removeCartItem(key);
        return newItems;
    });
  }, [isLoggedIn]);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
