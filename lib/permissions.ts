export type StaffRole = "ADMIN" | "MANAGER" | "SELLER";

/**
 * Rotas liberadas por função. ADMIN é tratado como superusuário.
 * A comparação usa prefixos para cobrir subrotas como /novo e /editar.
 */
export const rolePermissions: Record<StaffRole, readonly string[]> = {
  ADMIN: ["/admin"],
  MANAGER: [
    "/admin/produtos",
    "/admin/estoque",
    "/admin/vendas",
    "/admin/clientes",
  ],
  SELLER: ["/admin/vendas", "/admin/clientes"],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "ADMIN" || value === "MANAGER" || value === "SELLER";
}

export function canAccess(role: unknown, pathname: string): boolean {
  if (!isStaffRole(role)) return false;
  if (role === "ADMIN") return pathname === "/admin" || pathname.startsWith("/admin/");

  return rolePermissions[role].some(
    (allowedPath) => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );
}
