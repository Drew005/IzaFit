import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pathname = headers().get("x-izafit-pathname") ?? "/admin";
  const isSeller = user.role === "SELLER";
  const isAdmin = user.role === "ADMIN";
  const restrictedForSeller =
    pathname.startsWith("/admin/financeiro") ||
    pathname.startsWith("/admin/compras") ||
    pathname.startsWith("/admin/cupons");

  if (isSeller && restrictedForSeller) {
    redirect("/admin");
  }

  // Gestão de contas é exclusiva do Administrador.
  if (!isAdmin && pathname.startsWith("/admin/usuarios")) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user?.name ?? null} userRole={user.role as UserRole} />
      <main className="flex-1 min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
}
