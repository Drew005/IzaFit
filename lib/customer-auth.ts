"use server";

import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/jwt";
import { isValidCpf } from "@/lib/validators";

type AuthState = { error?: string; success?: string } | null;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/perfil";
}

function setCustomerSession(id: string) {
  return signToken({ sub: id, type: "customer" }).then((token) => {
    cookies().set("customer_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  });
}

export async function customerLogin(
  _prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Informe email e senha." };

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.active || !customer.passwordHash) {
    return { error: "Email ou senha inválidos." };
  }
  if (!(await compare(password, customer.passwordHash))) {
    return { error: "Email ou senha inválidos." };
  }

  await setCustomerSession(customer.id);
  redirect(next);
}

export async function customerRegister(
  _prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = safeNext(formData.get("next"));

  // CPF opcional no cadastro (pode ser preenchido depois no perfil).
  let cpf = (formData.get("cpf") as string)?.trim() || null;
  if (cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (!isValidCpf(cpf)) {
      return { error: "CPF inválido. Confira os números digitados." };
    }
  }

  if (!name || !email || !password) {
    return { error: "Preencha nome, email e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe uma conta de cliente com este email." };
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      cpf,
      passwordHash: await hash(password, 10),
      active: true,
    },
  });

  await setCustomerSession(customer.id);
  redirect(next);
}

export async function customerLogout() {
  cookies().delete("customer_session");
  redirect("/");
}

export async function getCurrentCustomer() {
  const token = cookies().get("customer_session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer") return null;

  return prisma.customer.findUnique({
    where: { id: payload.sub as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      birthDate: true,
      loyaltyPoints: true,
      createdAt: true,
      active: true,
    },
  });
}

export async function updateProfile(
  _prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Sessão expirada. Faça login novamente." };

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  // CPF (digitado apenas com números) — necessário para o pagamento via
  // Mercado Pago. Aceitamos também com máscara e normalizamos.
  let cpf = (formData.get("cpf") as string)?.trim() || null;
  if (cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (!isValidCpf(cpf)) {
      return { error: "CPF inválido. Confira os números digitados." };
    }
  }

  if (!name) return { error: "Informe seu nome." };

  await prisma.customer.update({
    where: { id: customer.id },
    data: { name, phone, cpf },
  });

  return { success: "Perfil atualizado com sucesso." };
}
