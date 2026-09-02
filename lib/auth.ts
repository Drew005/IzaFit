"use server";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Sessão stateless: guardamos o userId direto no cookie httpOnly.
// Funciona no Edge (middleware) e sobrevive a restarts. Para produção,
// troque por JWT assinado ou tabela Session no banco.

// Estado inicial/retorno padrão das ações de autenticação.
// Retornamos { error } em vez de "throw" para que o formulário mostre a
// mensagem inline em vez de cair na página 500.
type AuthState = { error: string } | null;

export async function login(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Informe email e senha." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { error: "Credenciais inválidas." };
  if (!(await compare(password, user.passwordHash))) {
    return { error: "Credenciais inválidas." };
  }

  cookies().set("session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  redirect("/admin");
}

export async function logout() {
  cookies().delete("session");
  redirect("/login");
}

export async function getCurrentUser() {
  const userId = cookies().get("session")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
