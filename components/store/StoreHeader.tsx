"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Heart,
  User,
  Shirt,
  TrendingUp,
  Sparkles,
  Layers,
  Library,
  Tag,
} from "lucide-react";
import { useCart } from "@/components/store/CartProvider";
import { useFavorites } from "@/components/store/FavoritesProvider";

export type StoreHeaderCustomer = {
  id: string;
  name: string;
  email: string | null;
} | null;

export default function StoreHeader({
  customer,
  logoUrl = "/izafitlogo.svg",
}: {
  customer: StoreHeaderCustomer;
  logoUrl?: string;
}) {
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();
  const initial = customer?.name?.trim().charAt(0).toUpperCase() || "?";
  const firstName = customer?.name?.split(" ")[0] || "conta";

  return (
    <header className="sticky top-0 z-40 border-b border-base-line bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="IzaFit Logo" className="h-8" />
        </Link>

        {/* Navegação principal */}
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <Link href="/produtos" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <Shirt size={15} />
            Produtos
          </Link>
          <Link href="/produtos?sort=best" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <TrendingUp size={15} />
            Mais vendidos
          </Link>
          <Link href="/produtos?sort=new" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <Sparkles size={15} />
            Novidades
          </Link>
          <Link href="/produtos?categoria=conjunto" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <Layers size={15} />
            Conjuntos
          </Link>
          <Link href="/produtos?categoria=colecao" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <Library size={15} />
            Coleções
          </Link>
          <Link href="/produtos?categoria=outlet" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <Tag size={15} />
            Outlet
          </Link>
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Favoritos */}
          <Link
            href="/favoritos"
            className="relative grid h-9 w-9 place-items-center rounded-sm border border-base-line text-ink-soft transition-colors hover:border-volt/60 hover:text-ink"
            title="Favoritos"
          >
            <Heart size={17} />
            {favCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-alert text-[10px] font-medium leading-none text-base">
                {favCount}
              </span>
            )}
          </Link>

          {/* Carrinho */}
          <Link
            href="/carrinho"
            className="relative grid h-9 w-9 place-items-center rounded-sm border border-base-line text-ink-soft transition-colors hover:border-volt/60 hover:text-ink"
            title="Carrinho"
          >
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-volt text-[10px] font-medium leading-none text-base">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Conta */}
          {customer ? (
            <div className="relative flex items-center gap-2 rounded-sm border border-base-line pl-1 pr-1">
              <Link
                href="/perfil"
                className="grid h-9 w-9 place-items-center rounded-sm text-ink-soft transition-colors hover:text-ink"
                title={customer.name}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-volt/15 text-xs font-semibold text-volt">
                  {initial}
                </span>
              </Link>
            </div>
          ) : (
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1.5 rounded-sm border border-base-line px-3 py-2 text-sm text-ink-soft transition-colors hover:border-volt/60 hover:text-ink"
              title="Entrar"
            >
              <User size={15} />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
