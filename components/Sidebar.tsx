"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingBag,
  Shirt,
  Boxes,
  Users,
  Ticket,
  Wallet,
  Truck,
  LogOut,
  UserCog,
  BadgePercent,
  Settings,
  Menu,
  X,
  ExternalLink,
  Store,
} from "lucide-react";
import clsx from "clsx";
import { logout } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

// Itens restritos para SELLER
const RESTRICTED_FOR_SELLER = new Set([
  "/admin/cupons",
  "/admin/financeiro",
  "/admin/compras",
]);

// Gestão de contas e configurações é exclusiva do Administrador
const ADMIN_ONLY = new Set(["/admin/usuarios", "/admin/configuracoes"]);

const ALL_NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutGrid },
  { href: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { href: "/admin/descontos", label: "Descontos", icon: BadgePercent },
  { href: "/admin/produtos", label: "Produtos", icon: Shirt },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/cupons", label: "Cupons & brindes", icon: Ticket },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/compras", label: "Compras & fornecedores", icon: Truck },
  { href: "/admin/usuarios", label: "Usuários & acessos", icon: UserCog },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({
  userName,
  userRole = "SELLER",
}: {
  userName: string | null;
  userRole?: UserRole;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu mobile automaticamente ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloqueia o scroll da página quando o menu mobile está aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  const NAV = ALL_NAV.filter((item) => {
    if (ADMIN_ONLY.has(item.href)) return userRole === "ADMIN";
    if (userRole === "SELLER") return !RESTRICTED_FOR_SELLER.has(item.href);
    return true;
  });

  const activeNavItem = NAV.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <>
      {/* ===================================================================== */}
      {/* TOPBAR MOBILE (visível apenas em telas < 768px) */}
      {/* ===================================================================== */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-base-line bg-base-raised/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-sm border border-base-line bg-base text-ink hover:border-volt/60 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-ink tracking-tight">Núcleo</span>
            {activeNavItem && (
              <span className="text-xs text-ink-soft hidden sm:inline">
                / {activeNavItem.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-sm border border-base-line bg-base px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
            title="Abrir loja pública em nova aba"
          >
            <Store size={13} className="text-volt" />
            <span className="hidden xs:inline">Ver loja</span>
          </Link>
          <span className="rounded-sm bg-volt/10 px-2 py-1 text-[10px] font-semibold text-volt uppercase">
            {userRole}
          </span>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* DRAWER / MENU MOBILE (Off-canvas) */}
      {/* ===================================================================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop escuro com clique para fechar */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Painel lateral deslizante */}
          <div className="fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-base-line bg-base-raised shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header do Drawer */}
            <div className="flex items-center justify-between border-b border-base-line px-5 py-4">
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-ink">
                  Núcleo
                </p>
                <p className="text-[11px] text-ink-soft">Painel administrativo</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-sm border border-base-line bg-base text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Link rápido para a Loja */}
            <div className="px-3 pt-3">
              <Link
                href="/"
                className="flex items-center justify-between rounded-sm border border-volt/30 bg-volt/5 px-3 py-2 text-xs font-medium text-volt hover:bg-volt/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Store size={14} />
                  Ver Loja Pública
                </span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {/* Navegação Principal */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-base text-ink font-medium border-l-2 border-volt"
                        : "text-ink-soft hover:text-ink hover:bg-base/60 border-l-2 border-transparent"
                    )}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.75}
                      className={active ? "text-volt" : "text-ink-soft"}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Rodapé do Drawer com Usuário e Sair */}
            <div className="border-t border-base-line px-5 py-4 space-y-3 bg-base/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] text-ink-soft">Logado como</p>
                  <p className="text-xs font-medium text-ink truncate">
                    {userName ?? "Equipe da loja"}
                  </p>
                </div>
                <span className="shrink-0 rounded-sm bg-volt/10 px-2 py-0.5 text-[10px] font-semibold text-volt uppercase">
                  {userRole}
                </span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-sm border border-base-line bg-base px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
                >
                  <LogOut size={14} />
                  Sair do painel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SIDEBAR DESKTOP (visível apenas em telas >= 768px) */}
      {/* ===================================================================== */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-base-line bg-base-raised sticky top-0 h-screen">
        <div className="px-6 pt-7 pb-6 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-medium tracking-tight text-ink">
              Núcleo
            </p>
            <p className="text-xs text-ink-soft mt-0.5">painel da loja</p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="grid h-7 w-7 place-items-center rounded-sm border border-base-line bg-base text-ink-soft hover:text-ink hover:border-volt/60 transition-colors"
            title="Abrir loja pública"
          >
            <ExternalLink size={13} />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-base text-ink border-l-2 border-volt"
                    : "text-ink-soft hover:text-ink hover:bg-base/60 border-l-2 border-transparent"
                )}
              >
                <Icon
                  size={17}
                  strokeWidth={1.75}
                  className={active ? "text-volt" : "text-ink-soft group-hover:text-ink"}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-base-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-ink-soft">Bem-vindo de volta,</p>
              <p className="text-sm text-ink mt-0.5 truncate">{userName ?? "Equipe da loja"}</p>
            </div>
            <span className="shrink-0 rounded-sm bg-volt/10 px-2 py-0.5 text-[10px] font-semibold text-volt uppercase">
              {userRole}
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
            >
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
