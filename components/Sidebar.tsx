"use client";

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
} from "lucide-react";
import clsx from "clsx";
import { logout } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

// Itens que o SELLER não deve acessar. Categorias ficam de fora porque o
// cadastro de produto exige categoria — SELLER gerencia o catálogo completo.
const RESTRICTED_FOR_SELLER = new Set([
  "/admin/cupons",
  "/admin/financeiro",
  "/admin/compras",
]);

// Gestão de contas é exclusiva do Administrador.
const ADMIN_ONLY = new Set(["/admin/usuarios"]);

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
];

export default function Sidebar({
  userName,
  userRole = "SELLER",
}: {
  userName: string | null;
  userRole?: UserRole;
}) {
  const pathname = usePathname();
  const NAV = ALL_NAV.filter((item) => {
    if (ADMIN_ONLY.has(item.href)) return userRole === "ADMIN";
    if (userRole === "SELLER") return !RESTRICTED_FOR_SELLER.has(item.href);
    return true;
  });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-base-line bg-base-raised">
      <div className="px-6 pt-7 pb-6">
        <p className="font-display text-lg font-medium tracking-tight text-ink">
          Núcleo
        </p>
        <p className="text-xs text-ink-soft mt-0.5">painel da loja</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
        <div>
          <p className="text-xs text-ink-soft">Bem-vindo de volta,</p>
          <p className="text-sm text-ink mt-0.5">{userName ?? "Equipe da loja"}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink-soft transition-colors hover:border-alert/60 hover:text-alert"
          >
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
