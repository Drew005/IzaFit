"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

type AddressState = { error?: string; success?: string } | null;

function requireFields(data: Record<string, string>) {
  const missing: string[] = [];
  if (!data.street) missing.push("Rua");
  if (!data.number) missing.push("Número");
  if (!data.district) missing.push("Bairro");
  if (!data.city) missing.push("Cidade");
  if (!data.state) missing.push("Estado");
  if (!data.zipCode) missing.push("CEP");
  return missing;
}

function normalize(data: FormData) {
  const label = (data.get("label") as string)?.trim() || null;
  const street = (data.get("street") as string)?.trim() ?? "";
  const number = (data.get("number") as string)?.trim() ?? "";
  const complement = (data.get("complement") as string)?.trim() || null;
  const district = (data.get("district") as string)?.trim() ?? "";
  const city = (data.get("city") as string)?.trim() ?? "";
  const rawState = (data.get("state") as string)?.trim().toUpperCase() ?? "";
  const state = rawState.slice(0, 2);
  const zipCode = ((data.get("zipCode") as string)?.trim() ?? "").replace(/\D/g, "");
  const isDefault = data.get("isDefault") === "on" || data.get("isDefault") === "true";
  const addressId = (data.get("addressId") as string)?.trim() || null;
  return { label, street, number, complement, district, city, state, zipCode, isDefault, addressId };
}

export async function createAddress(
  _prevState: AddressState | undefined,
  formData: FormData
): Promise<AddressState> {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Sessão expirada. Faça login novamente." };

  const d = normalize(formData);
  const missing = requireFields(d as unknown as Record<string, string>);
  if (missing.length) return { error: `Preencha: ${missing.join(", ")}.` };
  if (d.zipCode.length !== 8) return { error: "CEP deve ter 8 dígitos." };
  if (d.state.length !== 2) return { error: "Estado deve ser a sigla com 2 letras (ex: SP)." };

  const count = await prisma.address.count({ where: { customerId: customer.id } });
  const shouldBeDefault = d.isDefault || count === 0;

  if (shouldBeDefault) {
    await prisma.$transaction([
      prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
      prisma.address.create({
        data: {
          customerId: customer.id,
          label: d.label,
          street: d.street,
          number: d.number,
          complement: d.complement,
          district: d.district,
          city: d.city,
          state: d.state,
          zipCode: d.zipCode,
          isDefault: true,
        },
      }),
    ]);
  } else {
    await prisma.address.create({
      data: {
        customerId: customer.id,
        label: d.label,
        street: d.street,
        number: d.number,
        complement: d.complement,
        district: d.district,
        city: d.city,
        state: d.state,
        zipCode: d.zipCode,
        isDefault: false,
      },
    });
  }

  revalidatePath("/perfil");
  return { success: "Endereço adicionado." };
}

export async function updateAddress(
  _prevState: AddressState | undefined,
  formData: FormData
): Promise<AddressState> {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Sessão expirada. Faça login novamente." };

  const d = normalize(formData);
  if (!d.addressId) return { error: "Endereço não informado." };

  const existing = await prisma.address.findFirst({
    where: { id: d.addressId, customerId: customer.id },
  });
  if (!existing) return { error: "Endereço não encontrado." };

  const missing = requireFields(d as unknown as Record<string, string>);
  if (missing.length) return { error: `Preencha: ${missing.join(", ")}.` };
  if (d.zipCode.length !== 8) return { error: "CEP deve ter 8 dígitos." };
  if (d.state.length !== 2) return { error: "Estado deve ser a sigla com 2 letras." };

  if (d.isDefault) {
    await prisma.$transaction([
      prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
      prisma.address.update({
        where: { id: d.addressId },
        data: {
          label: d.label,
          street: d.street,
          number: d.number,
          complement: d.complement,
          district: d.district,
          city: d.city,
          state: d.state,
          zipCode: d.zipCode,
          isDefault: true,
        },
      }),
    ]);
  } else {
    // impedir deixar conta sem default se esse era o default e só existe um?
    // permitimos desmarcar; se sobrar nenhum default e houver outros endereços,
    // não forçamos. Mas se desmarcou o único, ele volta a ser default.
    const otherDefaults = await prisma.address.count({
      where: { customerId: customer.id, isDefault: true, id: { not: d.addressId } },
    });
    const keepDefault = existing.isDefault && otherDefaults === 0;
    await prisma.address.update({
      where: { id: d.addressId },
      data: {
        label: d.label,
        street: d.street,
        number: d.number,
        complement: d.complement,
        district: d.district,
        city: d.city,
        state: d.state,
        zipCode: d.zipCode,
        isDefault: keepDefault ? true : false,
      },
    });
  }

  revalidatePath("/perfil");
  return { success: "Endereço atualizado." };
}

export async function deleteAddress(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sessão expirada.");

  const id = (formData.get("addressId") as string)?.trim();
  if (!id) throw new Error("Endereço não informado.");

  const existing = await prisma.address.findFirst({
    where: { id, customerId: customer.id },
  });
  if (!existing) throw new Error("Endereço não encontrado.");

  await prisma.address.delete({ where: { id } });

  // se era principal, promove o mais antigo como novo principal
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { customerId: customer.id },
      orderBy: { id: "asc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/perfil");
}

export async function setDefaultAddress(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sessão expirada.");

  const id = (formData.get("addressId") as string)?.trim();
  if (!id) throw new Error("Endereço não informado.");

  const existing = await prisma.address.findFirst({
    where: { id, customerId: customer.id },
  });
  if (!existing) throw new Error("Endereço não encontrado.");

  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/perfil");
}
