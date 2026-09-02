"use server";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/jwt";

type AuthState = { error: string } | null;

export async function login(prevState: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Informe email e senha." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { error: "Credenciais inválidas." };
  if (!(await compare(password, user.passwordHash))) {
    return { error: "Credenciais inválidas." };
  }

  const token = await signToken({
    sub: user.id,
    name: user.name,
    role: user.role,
  });

  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logout() {
  cookies().delete("session");
  redirect("/login");
}

export async function getCurrentUser() {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { 
    id: payload.sub as string, 
    name: payload.name as string, 
    role: payload.role as string 
  };
}
