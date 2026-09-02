"use server";

import { prisma } from "@/lib/prisma";
import { uploadImage, deleteUploadedImages } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseProductDetails } from "@/lib/product-details";
import { hash } from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { findEligibleGifts } from "@/lib/gift-eligibility";
import {
  CouponType,
  ExpenseCategory,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PurchaseStatus,
  StockMovementType,
} from "@prisma/client";

// =============================================================================
// PRODUTOS & VARIANTES
// =============================================================================
// Upload de imagens agora via Supabase Storage (ver lib/upload.ts).
// =============================================================================
export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const categoryId = formData.get("categoryId") as string;
  const brand = (formData.get("brand") as string) || null;
  const supplierId = (formData.get("supplierId") as string) || null;
  const details = parseProductDetails(formData.get("details"));

  // Variantes
  const skuList = formData.getAll("sku") as string[];
  const costPriceList = formData.getAll("costPrice") as string[];
  const sellPriceList = formData.getAll("sellPrice") as string[];
  const stockQuantityList = formData.getAll("stockQuantity") as string[];
  const minStockAlertList = formData.getAll("minStockAlert") as string[];

  if (!name || !categoryId) {
    throw new Error("Nome e Categoria são obrigatórios.");
  }

  // — Fotos —
  const coverFile = formData.get("image") as File | null;
  const galleryFiles = formData.getAll("images") as File[];

  const coverUrl = await uploadImage(coverFile);
  const galleryUrls: string[] = [];
  for (const f of galleryFiles) {
    const url = await uploadImage(f);
    if (url) galleryUrls.push(url);
  }
  // A capa também entra na galeria como primeiro item.
  const allImages = [...(coverUrl ? [coverUrl] : []), ...galleryUrls];

  const product = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.create({
      data: {
        name,
        description,
        categoryId,
        brand,
        supplierId: supplierId || null,
        imageUrl: coverUrl,
        images: allImages,
        details: details,
        active: true,
      },
    });

    if (skuList && skuList.length > 0) {
      for (let i = 0; i < skuList.length; i++) {
        const sku = skuList[i]?.trim();
        if (!sku) continue;

        const costPrice = parseFloat(costPriceList[i] || "0");
        const sellPrice = parseFloat(sellPriceList[i] || "0");
        const stockQuantity = parseInt(stockQuantityList[i] || "0", 10);
        const minStockAlert = parseInt(minStockAlertList[i] || "5", 10);

        const variant = await tx.productVariant.create({
          data: {
            productId: prod.id,
            sku,
            costPrice,
            sellPrice,
            stockQuantity,
            minStockAlert,
            active: true,
          },
        });

        if (stockQuantity > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: StockMovementType.PURCHASE_IN,
              quantity: stockQuantity,
              reason: "Estoque inicial no cadastro do produto",
            },
          });
        }
      }
    }

    return prod;
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  redirect("/admin/produtos");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const categoryId = formData.get("categoryId") as string;
  const brand = (formData.get("brand") as string) || null;
  const supplierId = (formData.get("supplierId") as string) || null;
  const active = formData.get("active") === "true";
  const details = parseProductDetails(formData.get("details"));

  // — Fotos —
  const existing = await prisma.product.findUnique({ where: { id } });
  const existingImages: string[] = existing?.images ?? [];
  const existingCover = existing?.imageUrl ?? null;

  const coverFile = formData.get("image") as File | null;
  const galleryFiles = formData.getAll("images") as File[];
  const removedUrls = formData.getAll("removeImage") as string[];

  // Remove imagens marcadas pelo formulário.
  if (removedUrls.length > 0) {
    await deleteUploadedImages(removedUrls);
  }
  const removedSet = new Set(removedUrls.filter(Boolean));

  // Se subiu nova capa, substitui a atual (e apaga a antiga do disco).
  let coverUrl = existingCover;
  if (coverFile && coverFile.size > 0) {
    const newCover = await uploadImage(coverFile);
    if (newCover) {
      coverUrl = newCover;
      await deleteUploadedImages([existingCover]);
    }
  }

  // Monta galeria: mantém apenas as imagens não removidas, atualiza capa
  // se houve troca e adiciona novas fotos.
  let gallery = existingImages.filter((url) => !removedSet.has(url));
  if (coverUrl && !gallery.includes(coverUrl)) {
    gallery.unshift(coverUrl);
  }
  for (const f of galleryFiles) {
    const url = await uploadImage(f);
    if (url) gallery.push(url);
  }
  // Garante que a capa é sempre a primeira da galeria.
  if (coverUrl) {
    gallery = [coverUrl, ...gallery.filter((url) => url !== coverUrl)];
  }

  // Existing variants update
  const variantIds = formData.getAll("variantId") as string[];
  const skus = formData.getAll("variantSku") as string[];
  const costPrices = formData.getAll("variantCostPrice") as string[];
  const sellPrices = formData.getAll("variantSellPrice") as string[];
  const minStockAlerts = formData.getAll("variantMinStockAlert") as string[];
  const actives = formData.getAll("variantActive") as string[];

  // New variants
  const newSkus = formData.getAll("newSku") as string[];
  const newCostPrices = formData.getAll("newCostPrice") as string[];
  const newSellPrices = formData.getAll("newSellPrice") as string[];
  const newStockQuantities = formData.getAll("newStockQuantity") as string[];
  const newMinStockAlerts = formData.getAll("newMinStockAlert") as string[];

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        brand,
        supplierId: supplierId || null,
        imageUrl: coverUrl,
        images: gallery,
        details: details,
        active,
      },
    });

    // Update existing variants
    for (let i = 0; i < variantIds.length; i++) {
      const vId = variantIds[i];
      if (!vId) continue;
      await tx.productVariant.update({
        where: { id: vId },
        data: {
          sku: skus[i],
          costPrice: parseFloat(costPrices[i] || "0"),
          sellPrice: parseFloat(sellPrices[i] || "0"),
          minStockAlert: parseInt(minStockAlerts[i] || "5", 10),
          active: actives[i] === "true",
        },
      });
    }

    // Insert new variants
    for (let i = 0; i < newSkus.length; i++) {
      const sku = newSkus[i]?.trim();
      if (!sku) continue;

      const costPrice = parseFloat(newCostPrices[i] || "0");
      const sellPrice = parseFloat(newSellPrices[i] || "0");
      const stockQuantity = parseInt(newStockQuantities[i] || "0", 10);
      const minStockAlert = parseInt(newMinStockAlerts[i] || "5", 10);

      const variant = await tx.productVariant.create({
        data: {
          productId: id,
          sku,
          costPrice,
          sellPrice,
          stockQuantity,
          minStockAlert,
          active: true,
        },
      });

      if (stockQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: StockMovementType.PURCHASE_IN,
            quantity: stockQuantity,
            reason: "Estoque inicial de nova variação",
          },
        });
      }
    }
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  redirect("/admin/produtos");
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  await prisma.product.delete({
    where: { id },
  });

  // Remove as fotos do Storage que pertenciam ao produto.
  if (product) {
    const all = [product.imageUrl, ...(product.images ?? [])];
    await deleteUploadedImages(all);
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin");
  redirect("/admin/produtos");
}

// =============================================================================
// CATEGORIAS & FORNECEDORES
// =============================================================================

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  let slug = (formData.get("slug") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;

  if (!name || !name.trim()) {
    throw new Error("Nome da categoria é obrigatório.");
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      parentId: parentId || null,
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/categorias");
  revalidatePath("/admin/produtos/novo");
  redirect("/admin/produtos/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  let slug = (formData.get("slug") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;

  if (!name || !name.trim()) {
    throw new Error("Nome da categoria é obrigatório.");
  }

  if (parentId === id) {
    throw new Error("Uma categoria não pode ser subcategoria de si mesma.");
  }

  if (!slug) {
    slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  await prisma.category.update({
    where: { id },
    data: {
      name: name.trim(),
      slug,
      parentId: parentId || null,
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/categorias");
  revalidatePath("/admin/produtos/novo");
  redirect("/admin/produtos/categorias");
}

export async function deleteCategory(id: string) {
  const categoryWithProducts = await prisma.category.findUnique({
    where: { id },
    include: {
      products: { select: { id: true } },
      children: { select: { id: true } },
    },
  });

  if (!categoryWithProducts) {
    throw new Error("Categoria não encontrada.");
  }

  if (categoryWithProducts.products.length > 0) {
    throw new Error(
      `Não é possível excluir: existem ${categoryWithProducts.products.length} produto(s) vinculados a esta categoria.`
    );
  }

  if (categoryWithProducts.children.length > 0) {
    throw new Error(
      `Não é possível excluir: existem ${categoryWithProducts.children.length} subcategoria(s) vinculadas a esta categoria.`
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/categorias");
  revalidatePath("/admin/produtos/novo");
  redirect("/admin/produtos/categorias");
}

export async function createSupplier(formData: FormData) {
  const name = formData.get("name") as string;
  const cnpj = (formData.get("cnpj") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  if (!name) throw new Error("Nome do fornecedor é obrigatório.");

  await prisma.supplier.create({
    data: { name, cnpj, phone, email },
  });

  revalidatePath("/admin/compras");
  revalidatePath("/admin/produtos");
  redirect("/admin/compras");
}

// =============================================================================
// CLIENTES
// =============================================================================

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpf = (formData.get("cpf") as string) || null;
  const loyaltyPoints = parseInt((formData.get("loyaltyPoints") as string) || "0", 10);
  const notes = (formData.get("notes") as string) || null;

  // Address
  const street = formData.get("street") as string;
  const number = formData.get("number") as string;
  const complement = formData.get("complement") as string;
  const district = formData.get("district") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;

  if (!name) throw new Error("Nome do cliente é obrigatório.");

  await prisma.customer.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      cpf: cpf || null,
      loyaltyPoints,
      notes: notes || null,
      addresses: street
        ? {
            create: {
              street,
              number: number || "S/N",
              complement: complement || null,
              district: district || "",
              city: city || "",
              state: state || "",
              zipCode: zipCode || "",
              isDefault: true,
            },
          }
        : undefined,
    },
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const cpf = (formData.get("cpf") as string) || null;
  const loyaltyPoints = parseInt((formData.get("loyaltyPoints") as string) || "0", 10);
  const notes = (formData.get("notes") as string) || null;

  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      cpf: cpf || null,
      loyaltyPoints,
      notes: notes || null,
    },
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({
    where: { id },
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// =============================================================================
// USUÁRIOS & ACESSO (somente ADMIN)
// =============================================================================

// Só o ADMIN pode gerenciar contas. Proteção no servidor (não só na UI) para
// bloquear chamadas diretas às server actions por usuários sem permissão.
async function requireAdmin() {
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    throw new Error("Acesso restrito ao administrador.");
  }
  return current;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "SELLER";
  const active = formData.get("active") === "true";

  if (!name || !email || !password) {
    throw new Error("Nome, email e senha são obrigatórios.");
  }
  if (password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Já existe uma conta com este email.");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hash(password, 10),
      role: role as "ADMIN" | "MANAGER" | "SELLER",
      active,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "SELLER";
  const active = formData.get("active") === "true";

  if (!name || !email) {
    throw new Error("Nome e email são obrigatórios.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    throw new Error("Já existe outra conta com este email.");
  }

  const data: {
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "SELLER";
    active: boolean;
    passwordHash?: string;
  } = {
    name,
    email,
    role: role as "ADMIN" | "MANAGER" | "SELLER",
    active,
  };

  // Campo de senha vazio no form = mantém a senha atual.
  if (password && password.length > 0) {
    if (password.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }
    data.passwordHash = await hash(password, 10);
  }

  await prisma.user.update({ where: { id }, data });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function deleteUser(id: string) {
  const current = await requireAdmin();

  if (current.id === id) {
    throw new Error("Você não pode excluir a própria conta.");
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

// =============================================================================
// VENDAS (ORDERS)
// =============================================================================

export async function createOrder(formData: FormData) {
  const customerId = (formData.get("customerId") as string) || null;
  const couponCode = (formData.get("couponCode") as string) || null;
  const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.PIX;
  const installments = parseInt((formData.get("installments") as string) || "1", 10);
  const status = (formData.get("status") as OrderStatus) || OrderStatus.PAID;

  const variantIds = formData.getAll("variantId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const giftIds = formData.getAll("giftId") as string[];

  if (!variantIds || variantIds.length === 0) {
    throw new Error("Selecione pelo menos um produto para a venda.");
  }

  await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const itemsData = [];

    for (let i = 0; i < variantIds.length; i++) {
      const vId = variantIds[i];
      const qty = parseInt(quantities[i] || "1", 10);
      const price = parseFloat(unitPrices[i] || "0");
      const lineSubtotal = qty * price;

      subtotal += lineSubtotal;
      itemsData.push({
        variantId: vId,
        quantity: qty,
        unitPrice: price,
        subtotal: lineSubtotal,
      });

      // Se pedido pago/concluído/enviado, debita estoque
      if (["PAID", "COMPLETED", "SHIPPED"].includes(status)) {
        await tx.productVariant.update({
          where: { id: vId },
          data: {
            stockQuantity: {
              decrement: qty,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: vId,
            type: StockMovementType.SALE_OUT,
            quantity: qty,
            reason: `Venda balcão / online`,
          },
        });
      }
    }

    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.active) {
        couponId = coupon.id;
        if (coupon.type === CouponType.PERCENTAGE) {
          discount = subtotal * (Number(coupon.value) / 100);
        } else {
          discount = Math.min(Number(coupon.value), subtotal);
        }

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const total = Math.max(0, subtotal - discount);

    const order = await tx.order.create({
      data: {
        customerId: customerId || null,
        couponId,
        status,
        subtotal,
        discount,
        total,
        items: {
          create: itemsData,
        },
        payments: {
          create: {
            method: paymentMethod,
            amount: total,
            installments,
            status: ["PAID", "COMPLETED", "SHIPPED"].includes(status)
              ? PaymentStatus.APPROVED
              : PaymentStatus.PENDING,
            paidAt: ["PAID", "COMPLETED", "SHIPPED"].includes(status)
              ? new Date()
              : null,
          },
        },
      },
    });

    // Vincular brindes
    // Brindes elegíveis automaticamente quando o pedido cumpre o requisito
    // (minPurchaseValue + produto/categoria). Junta com os brindes selecionados
    // manualmente no form.
    const targetedGifts = await findEligibleGifts(tx, {
      variantIds,
      subtotal,
    });

    // Dedupe: brinde auto-elegível não deve se repetir com o manual.
    const selectedGiftIds = Array.from(
      new Set([...giftIds, ...targetedGifts.map((g) => g.id)])
    );

    if (selectedGiftIds.length > 0) {
      for (const gId of selectedGiftIds) {
        const gift = targetedGifts.find((g) => g.id === gId);
        // Só debita estoque de brinde elegível automaticamente; brindes manuais
        // descontam também, mas sem permitir estoque negativo.
        if (gift && gift.stockQuantity <= 0) continue;

        await tx.orderGift.create({
          data: {
            orderId: order.id,
            giftId: gId,
          },
        });

        // Se pedido pago/concluído/enviado, debita estoque do brinde
        if (["PAID", "COMPLETED", "SHIPPED"].includes(status)) {
          await tx.gift.updateMany({
            where: { id: gId, stockQuantity: { gt: 0 } },
            data: {
              stockQuantity: { decrement: 1 },
            },
          });
        }
      }
    }

    // Pontos de fidelidade (1 ponto a cada R$ 10)
    if (customerId && ["PAID", "COMPLETED", "SHIPPED"].includes(status)) {
      const earnedPoints = Math.floor(total / 10);
      if (earnedPoints > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              increment: earnedPoints,
            },
          },
        });
      }
    }

    return order;
  });

  revalidatePath("/admin/vendas");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/cupons");
  revalidatePath("/admin");
  redirect("/admin/vendas");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  // Buscar o pedido atual com itens para saber o que restaurar
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      gifts: { include: { gift: true } },
    },
  });

  if (!existingOrder) {
    throw new Error("Pedido não encontrado.");
  }

  const wasCompleted = ["PAID", "COMPLETED", "SHIPPED"].includes(existingOrder.status);
  const willBeCanceled = ["CANCELED", "REFUNDED"].includes(status);

  await prisma.$transaction(async (tx) => {
    // Atualiza o status
    await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Se estava completo e vai ser cancelado/reembolsado -> restaurar estoque
    if (wasCompleted && willBeCanceled) {
      // 1. Restaurar estoque dos produtos da venda
      for (const item of existingOrder.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: StockMovementType.RETURN_IN,
            quantity: item.quantity,
            reason: `Cancelamento do pedido ${orderId.slice(-4).toUpperCase()}`,
            referenceId: orderId,
          },
        });
      }

      // 2. Restaurar estoque dos brindes
      for (const og of existingOrder.gifts) {
        await tx.gift.update({
          where: { id: og.giftId },
          data: {
            stockQuantity: {
              increment: og.quantity,
            },
          },
        });
      }

      // 3. Remover pontos de fidelidade ganhos (se houver cliente)
      if (existingOrder.customerId) {
        const earnedPoints = Math.floor(Number(existingOrder.total) / 10);
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: existingOrder.customerId },
            data: {
              loyaltyPoints: {
                decrement: earnedPoints,
              },
            },
          });
        }
      }
    }

    // Se estava cancelado e vai para status pago -> baixar estoque (reabrir)
    if (!wasCompleted && ["PAID", "COMPLETED", "SHIPPED"].includes(status)) {
      for (const item of existingOrder.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: StockMovementType.SALE_OUT,
            quantity: item.quantity,
            reason: `Reabertura do pedido ${orderId.slice(-4).toUpperCase()}`,
            referenceId: orderId,
          },
        });
      }

      // Debitar brindes
      for (const og of existingOrder.gifts) {
        await tx.gift.update({
          where: { id: og.giftId },
          data: {
            stockQuantity: {
              decrement: og.quantity,
            },
          },
        });
      }

      // Adicionar pontos de fidelidade
      if (existingOrder.customerId) {
        const earnedPoints = Math.floor(Number(existingOrder.total) / 10);
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: existingOrder.customerId },
            data: {
              loyaltyPoints: {
                increment: earnedPoints,
              },
            },
          });
        }
      }
    }
  });

  revalidatePath("/admin/vendas");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/cupons");
  revalidatePath("/admin");
}

// =============================================================================
// ESTOQUE (MOVIMENTAÇÕES & AJUSTES)
// =============================================================================

export async function createStockMovement(formData: FormData) {
  const variantId = formData.get("variantId") as string;
  const type = formData.get("type") as StockMovementType;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const reason = (formData.get("reason") as string) || null;

  if (!variantId || !quantity || quantity <= 0) {
    throw new Error("Variante e quantidade válida são obrigatórias.");
  }

  await prisma.$transaction(async (tx) => {
    // Definir se soma ou subtrai
    let isIncrement = true;
    if (type === StockMovementType.SALE_OUT) {
      isIncrement = false;
    } else if (type === StockMovementType.ADJUSTMENT) {
      const adjustmentKind = formData.get("adjustmentKind") as string; // "add" or "remove"
      isIncrement = adjustmentKind !== "remove";
    }

    await tx.stockMovement.create({
      data: {
        variantId,
        type,
        quantity: isIncrement ? quantity : -quantity,
        reason,
      },
    });

    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stockQuantity: isIncrement
          ? { increment: quantity }
          : { decrement: quantity },
      },
    });
  });

  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  redirect("/admin/estoque");
}

// =============================================================================
// CUPONS & BRINDES
// =============================================================================

export async function createCoupon(formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const type = formData.get("type") as CouponType;
  const value = parseFloat(formData.get("value") as string);
  const minPurchase = formData.get("minPurchase")
    ? parseFloat(formData.get("minPurchase") as string)
    : null;
  const maxUses = formData.get("maxUses")
    ? parseInt(formData.get("maxUses") as string, 10)
    : null;
  const validUntilStr = formData.get("validUntil") as string;
  const validUntil = validUntilStr ? new Date(validUntilStr) : null;

  if (!code || isNaN(value)) {
    throw new Error("Código e Valor são obrigatórios.");
  }

  await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      minPurchase,
      maxUses,
      validUntil,
      active: true,
    },
  });

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function updateCoupon(id: string, formData: FormData) {
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const type = formData.get("type") as CouponType;
  const value = parseFloat(formData.get("value") as string);
  const minPurchase = formData.get("minPurchase")
    ? parseFloat(formData.get("minPurchase") as string)
    : null;
  const maxUses = formData.get("maxUses")
    ? parseInt(formData.get("maxUses") as string, 10)
    : null;
  const validUntilStr = formData.get("validUntil") as string;
  const validUntil = validUntilStr ? new Date(validUntilStr) : null;
  const active = formData.get("active") === "true";

  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      type,
      value,
      minPurchase,
      maxUses,
      validUntil,
      active,
    },
  });

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function createGift(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const stockQuantity = parseInt((formData.get("stockQuantity") as string) || "0", 10);
  const minPurchaseValue = formData.get("minPurchaseValue")
    ? parseFloat(formData.get("minPurchaseValue") as string)
    : null;
  const minLoyaltyPoints = formData.get("minLoyaltyPoints")
    ? parseInt(formData.get("minLoyaltyPoints") as string, 10)
    : null;
  const productId = (formData.get("productId") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;

  if (!name) throw new Error("Nome do brinde é obrigatório.");

  await prisma.gift.create({
    data: {
      name,
      description,
      stockQuantity,
      minPurchaseValue,
      minLoyaltyPoints,
      productId,
      categoryId,
      active: true,
    },
  });

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function updateGift(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const stockQuantity = parseInt((formData.get("stockQuantity") as string) || "0", 10);
  const minPurchaseValue = formData.get("minPurchaseValue")
    ? parseFloat(formData.get("minPurchaseValue") as string)
    : null;
  const minLoyaltyPoints = formData.get("minLoyaltyPoints")
    ? parseInt(formData.get("minLoyaltyPoints") as string, 10)
    : null;
  const productId = (formData.get("productId") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const active = formData.get("active") === "true";

  if (!name) throw new Error("Nome do brinde é obrigatório.");

  await prisma.gift.update({
    where: { id },
    data: {
      name,
      description,
      stockQuantity,
      minPurchaseValue,
      minLoyaltyPoints,
      productId,
      categoryId,
      active,
    },
  });

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function deleteGift(id: string) {
  await prisma.gift.delete({ where: { id } });
  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

// =============================================================================
// COMPRAS & FORNECEDORES
// =============================================================================

export async function createPurchase(formData: FormData) {
  const supplierId = formData.get("supplierId") as string;
  const status = (formData.get("status") as PurchaseStatus) || PurchaseStatus.PENDING;
  const notes = (formData.get("notes") as string) || null;

  const variantIds = formData.getAll("variantId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitCosts = formData.getAll("unitCost") as string[];

  if (!supplierId || !variantIds || variantIds.length === 0) {
    throw new Error("Selecione um fornecedor e pelo menos um item.");
  }

  await prisma.$transaction(async (tx) => {
    let totalCost = 0;
    const itemsData = [];

    for (let i = 0; i < variantIds.length; i++) {
      const vId = variantIds[i];
      const qty = parseInt(quantities[i] || "1", 10);
      const unitCost = parseFloat(unitCosts[i] || "0");
      const lineCost = qty * unitCost;

      totalCost += lineCost;
      itemsData.push({
        variantId: vId,
        quantity: qty,
        unitCost,
      });

      // Se já recebido, incrementa estoque e registra movimentação
      if (status === PurchaseStatus.RECEIVED) {
        await tx.productVariant.update({
          where: { id: vId },
          data: {
            stockQuantity: { increment: qty },
            costPrice: unitCost > 0 ? unitCost : undefined,
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: vId,
            type: StockMovementType.PURCHASE_IN,
            quantity: qty,
            reason: `Entrada compra fornecedor`,
          },
        });
      }
    }

    const purchase = await tx.purchase.create({
      data: {
        supplierId,
        status,
        totalCost,
        notes,
        receivedAt: status === PurchaseStatus.RECEIVED ? new Date() : null,
        items: {
          create: itemsData,
        },
      },
    });

    return purchase;
  });

  revalidatePath("/admin/compras");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  redirect("/admin/compras");
}

export async function updatePurchaseStatus(purchaseId: string, status: PurchaseStatus) {
  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase) throw new Error("Compra não encontrada.");

    if (purchase.status !== PurchaseStatus.RECEIVED && status === PurchaseStatus.RECEIVED) {
      // Receber mercadoria -> dar entrada no estoque
      for (const item of purchase.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: StockMovementType.PURCHASE_IN,
            quantity: item.quantity,
            reason: `Recebimento compra CP-${purchase.id.slice(-4).toUpperCase()}`,
          },
        });
      }
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status,
        receivedAt: status === PurchaseStatus.RECEIVED ? new Date() : null,
      },
    });
  });

  revalidatePath("/admin/compras");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
}

// =============================================================================
// FINANCEIRO / DESPESAS
// =============================================================================

export async function createExpense(formData: FormData) {
  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dueDateStr = formData.get("dueDate") as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : new Date();
  const recurring = formData.get("recurring") === "on" || formData.get("recurring") === "true";
  const paid = formData.get("paid") === "on" || formData.get("paid") === "true";

  if (!description || isNaN(amount)) {
    throw new Error("Descrição e Valor são obrigatórios.");
  }

  await prisma.expense.create({
    data: {
      category,
      description,
      amount,
      dueDate,
      recurring,
      paidAt: paid ? new Date() : null,
    },
  });

  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  redirect("/admin/financeiro");
}

export async function updateExpense(id: string, formData: FormData) {
  const category = formData.get("category") as ExpenseCategory;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dueDateStr = formData.get("dueDate") as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : new Date();
  const recurring = formData.get("recurring") === "on" || formData.get("recurring") === "true";
  const paid = formData.get("paid") === "on" || formData.get("paid") === "true";

  await prisma.expense.update({
    where: { id },
    data: {
      category,
      description,
      amount,
      dueDate,
      recurring,
      paidAt: paid ? new Date() : null,
    },
  });

  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  redirect("/admin/financeiro");
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  redirect("/admin/financeiro");
}
