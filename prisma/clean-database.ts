#!/usr/bin/env ts-node

// Script para limpar o banco mantendo apenas User e Store
// Execute: npx ts-node prisma/clean-database.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Iniciando limpeza do banco (mantendo User e Store)...");

  // Ordem de deleção: do mais "folha" para a raiz (respeitando FKs)
  // Tabelas com onDelete: Cascade serão limpas automaticamente junto com o pai
  // mas por segurança apagamos filhos primeiro onde não há cascade total.

  const deletions = [
    // Nível 1: tabelas que dependem de outras e não têm cascade total
    { model: "orderGift", name: "Brindes do pedido" },
    { model: "payment", name: "Pagamentos" },
    { model: "orderItem", name: "Itens do pedido" },
    { model: "order", name: "Pedidos" },

    { model: "purchaseItem", name: "Itens de compra" },
    { model: "purchase", name: "Compras" },

    { model: "stockMovement", name: "Movimentações de estoque" },

    { model: "variantAttributeValue", name: "Valores de atributo da variante" },
    { model: "productVariant", name: "Variantes de produto" },
    { model: "product", name: "Produtos" },

    { model: "attributeValue", name: "Valores de atributo" },
    { model: "attribute", name: "Atributos" },

    { model: "gift", name: "Brindes" },
    { model: "coupon", name: "Cupons" },

    { model: "address", name: "Endereços" },
    { model: "customer", name: "Clientes" },

    { model: "supplier", name: "Fornecedores" },
    { model: "category", name: "Categorias" },

    { model: "expense", name: "Despesas" },
  ];

  for (const { model, name } of deletions) {
    try {
      // @ts-expect-accessing dynamic model
      const result = await (prisma as any)[model].deleteMany({});
      console.log(`  ✓ ${name} (${model}): ${result.count} registros removidos`);
    } catch (e: any) {
      console.error(`  ⚠ ${name} (${model}): ${e.message}`);
    }
  }

  // Verifica o que sobrou
  const users = await prisma.user.count();
  const stores = await prisma.store.count();

  console.log("\n✅ Limpeza concluída.");
  console.log(`   Users restantes: ${users}`);
  console.log(`   Stores restantes: ${stores}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });