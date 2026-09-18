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

  // O middleware agora cuida de redirecionar acessos negados.
  // Aqui apenas mantemos a garantia de tipo para o Sidebar.

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-base">
      <Sidebar userName={user?.name ?? null} userRole={user.role as UserRole} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
