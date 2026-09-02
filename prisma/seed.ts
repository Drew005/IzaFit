import {
  PrismaClient,
  UserRole,
  StockMovementType,
  PurchaseStatus,
  CouponType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ExpenseCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // 1. Limpeza
  await prisma.orderGift.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.variantAttributeValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  // 2. Loja Principal
  const store = await prisma.store.create({
    data: {
      name: "IzaFit Matriz",
      cnpj: "12.345.678/0001-90",
      phone: "(11) 98765-4321",
      address: "Rua Fitness, 100 - São Paulo, SP",
    },
  });

  // 3. Usuários
  const admin = await prisma.user.create({
    data: {
      name: "Izabela Silva",
      email: "admin@izafit.com.br",
      passwordHash: "hash_placeholder",
      role: UserRole.ADMIN,
      storeId: store.id,
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: "Carlos Vendedor",
      email: "carlos@izafit.com.br",
      passwordHash: "hash_placeholder",
      role: UserRole.SELLER,
      storeId: store.id,
    },
  });

  // 4. Categorias
  const catLeggings = await prisma.category.create({
    data: { name: "Leggings", slug: "leggings" },
  });
  const catTops = await prisma.category.create({
    data: { name: "Tops", slug: "tops" },
  });
  const catCamisetas = await prisma.category.create({
    data: { name: "Camisetas", slug: "camisetas" },
  });
  const catShorts = await prisma.category.create({
    data: { name: "Shorts", slug: "shorts" },
  });
  const catSuplementos = await prisma.category.create({
    data: { name: "Suplementos", slug: "suplementos" },
  });
  const catAcessorios = await prisma.category.create({
    data: { name: "Acessórios", slug: "acessorios" },
  });

  // 5. Fornecedores
  const supMalharia = await prisma.supplier.create({
    data: {
      name: "Malharia Vitória",
      cnpj: "98.765.432/0001-10",
      phone: "(19) 3456-7890",
      email: "contato@malhariavitoria.com.br",
    },
  });

  const supNutri = await prisma.supplier.create({
    data: {
      name: "NutriBrasil Distribuidora",
      cnpj: "87.654.321/0001-20",
      phone: "(11) 4567-8901",
      email: "vendas@nutribrasil.com.br",
    },
  });

  // 6. Atributos e Valores
  const attrTamanho = await prisma.attribute.create({ data: { name: "Tamanho" } });
  const attrCor = await prisma.attribute.create({ data: { name: "Cor" } });
  const attrSabor = await prisma.attribute.create({ data: { name: "Sabor" } });

  const valP = await prisma.attributeValue.create({ data: { attributeId: attrTamanho.id, value: "P" } });
  const valM = await prisma.attributeValue.create({ data: { attributeId: attrTamanho.id, value: "M" } });
  const valG = await prisma.attributeValue.create({ data: { attributeId: attrTamanho.id, value: "G" } });
  const valPreto = await prisma.attributeValue.create({ data: { attributeId: attrCor.id, value: "Preto" } });
  const valGrafite = await prisma.attributeValue.create({ data: { attributeId: attrCor.id, value: "Grafite" } });
  const valBranco = await prisma.attributeValue.create({ data: { attributeId: attrCor.id, value: "Branco" } });
  const valChoc = await prisma.attributeValue.create({ data: { attributeId: attrSabor.id, value: "Chocolate" } });

  // 7. Produtos e Variantes
  // Produto 1: Legging Performance
  const prodLegging = await prisma.product.create({
    data: {
      name: "Legging Performance",
      description: "Legging de alta compressão com proteção UV50+",
      categoryId: catLeggings.id,
      supplierId: supMalharia.id,
      brand: "IzaFit",
    },
  });

  const varLeggingP = await prisma.productVariant.create({
    data: {
      productId: prodLegging.id,
      sku: "LEG-PERF-P-BLK",
      barcode: "78910001",
      costPrice: 55.0,
      sellPrice: 149.9,
      stockQuantity: 2,
      minStockAlert: 5,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valP.id },
          { attributeValueId: valPreto.id },
        ],
      },
    },
  });

  const varLeggingM = await prisma.productVariant.create({
    data: {
      productId: prodLegging.id,
      sku: "LEG-PERF-M-BLK",
      barcode: "78910002",
      costPrice: 55.0,
      sellPrice: 149.9,
      stockQuantity: 18,
      minStockAlert: 5,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valM.id },
          { attributeValueId: valPreto.id },
        ],
      },
    },
  });

  const varLeggingG = await prisma.productVariant.create({
    data: {
      productId: prodLegging.id,
      sku: "LEG-PERF-G-BLK",
      barcode: "78910003",
      costPrice: 55.0,
      sellPrice: 149.9,
      stockQuantity: 18,
      minStockAlert: 5,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valG.id },
          { attributeValueId: valPreto.id },
        ],
      },
    },
  });

  // Produto 2: Top Fitness Cross
  const prodTop = await prisma.product.create({
    data: {
      name: "Top Fitness Cross",
      description: "Top com sustentação reforçada e alças cruzadas",
      categoryId: catTops.id,
      supplierId: supMalharia.id,
      brand: "IzaFit",
    },
  });

  const varTopM = await prisma.productVariant.create({
    data: {
      productId: prodTop.id,
      sku: "TOP-CRS-M-GRF",
      barcode: "78920001",
      costPrice: 32.0,
      sellPrice: 89.9,
      stockQuantity: 3,
      minStockAlert: 5,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valM.id },
          { attributeValueId: valGrafite.id },
        ],
      },
    },
  });

  // Produto 3: Camiseta Dry Fit
  const prodCamiseta = await prisma.product.create({
    data: {
      name: "Camiseta Dry Fit",
      description: "Tecido respirável e secagem rápida",
      categoryId: catCamisetas.id,
      supplierId: supMalharia.id,
      brand: "IzaFit",
    },
  });

  const varCamisetaG = await prisma.productVariant.create({
    data: {
      productId: prodCamiseta.id,
      sku: "CAM-DRY-G-WHT",
      barcode: "78930001",
      costPrice: 28.0,
      sellPrice: 79.9,
      stockQuantity: 1,
      minStockAlert: 8,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valG.id },
          { attributeValueId: valBranco.id },
        ],
      },
    },
  });

  // Produto 4: Short Compressão
  const prodShort = await prisma.product.create({
    data: {
      name: "Short Compressão",
      description: "Short com bolso interno para celular",
      categoryId: catShorts.id,
      supplierId: supMalharia.id,
      brand: "IzaFit",
    },
  });

  const varShortM = await prisma.productVariant.create({
    data: {
      productId: prodShort.id,
      sku: "SHT-CMP-M-BLK",
      barcode: "78940001",
      costPrice: 38.0,
      sellPrice: 99.9,
      stockQuantity: 4,
      minStockAlert: 6,
      storeId: store.id,
      attributeValues: {
        create: [
          { attributeValueId: valM.id },
          { attributeValueId: valPreto.id },
        ],
      },
    },
  });

  // Produto 5: Whey Protein 900g
  const prodWhey = await prisma.product.create({
    data: {
      name: "Whey Protein 900g",
      description: "100% Whey Concentrado com 24g de proteína por porção",
      categoryId: catSuplementos.id,
      supplierId: supNutri.id,
      brand: "NutriBrasil",
    },
  });

  const varWheyChoc = await prisma.productVariant.create({
    data: {
      productId: prodWhey.id,
      sku: "WHY-900-CHO",
      barcode: "78950001",
      costPrice: 85.0,
      sellPrice: 179.9,
      stockQuantity: 54,
      minStockAlert: 10,
      storeId: store.id,
      attributeValues: {
        create: [{ attributeValueId: valChoc.id }],
      },
    },
  });

  // Produto 6: Coqueteleira 600ml
  const prodCoqueteleira = await prisma.product.create({
    data: {
      name: "Coqueteleira 600ml",
      description: "Coqueteleira livre de BPA com misturador",
      categoryId: catAcessorios.id,
      supplierId: supNutri.id,
      brand: "IzaFit",
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: prodCoqueteleira.id,
      sku: "COQ-600-BLK",
      barcode: "78960001",
      costPrice: 12.0,
      sellPrice: 34.9,
      stockQuantity: 60,
      minStockAlert: 10,
      storeId: store.id,
      attributeValues: {
        create: [{ attributeValueId: valPreto.id }],
      },
    },
  });

  // 8. Movimentações de Estoque
  await prisma.stockMovement.createMany({
    data: [
      {
        variantId: varLeggingP.id,
        type: StockMovementType.SALE_OUT,
        quantity: 2,
        reason: "Venda PD-1042",
        userId: seller.id,
        createdAt: new Date("2026-08-29T14:20:00Z"),
      },
      {
        variantId: varWheyChoc.id,
        type: StockMovementType.PURCHASE_IN,
        quantity: 40,
        reason: "Entrada Compra CP-230",
        userId: admin.id,
        createdAt: new Date("2026-08-29T11:05:00Z"),
      },
      {
        variantId: varCamisetaG.id,
        type: StockMovementType.SALE_OUT,
        quantity: 1,
        reason: "Venda PD-1040",
        userId: seller.id,
        createdAt: new Date("2026-08-28T17:40:00Z"),
      },
      {
        variantId: varTopM.id,
        type: StockMovementType.ADJUSTMENT,
        quantity: -1,
        reason: "Ajuste por avaria no tecido",
        userId: admin.id,
        createdAt: new Date("2026-08-28T09:12:00Z"),
      },
    ],
  });

  // 9. Clientes
  const custMarina = await prisma.customer.create({
    data: {
      name: "Marina Souza",
      email: "marina.souza@gmail.com",
      phone: "(11) 99123-4567",
      loyaltyPoints: 320,
    },
  });

  const custRafael = await prisma.customer.create({
    data: {
      name: "Rafael Lima",
      email: "rafael.lima@gmail.com",
      phone: "(11) 98234-5678",
      loyaltyPoints: 210,
    },
  });

  const custBeatriz = await prisma.customer.create({
    data: {
      name: "Beatriz Alves",
      email: "beatriz.alves@gmail.com",
      phone: "(11) 97345-6789",
      loyaltyPoints: 60,
    },
  });

  const custJoao = await prisma.customer.create({
    data: {
      name: "João Pedro",
      email: "joao.pedro@gmail.com",
      phone: "(11) 96456-7890",
      loyaltyPoints: 610,
    },
  });

  // 10. Cupons e Brindes
  await prisma.coupon.createMany({
    data: [
      {
        code: "BEMVINDO10",
        type: CouponType.PERCENTAGE,
        value: 10,
        usedCount: 84,
        maxUses: null,
        active: true,
      },
      {
        code: "FRETEZERO",
        type: CouponType.FIXED,
        value: 20.0,
        usedCount: 40,
        maxUses: 100,
        validUntil: new Date("2026-09-30T23:59:59Z"),
        active: true,
      },
      {
        code: "BLACKFIT",
        type: CouponType.PERCENTAGE,
        value: 25,
        usedCount: 0,
        maxUses: 500,
        validFrom: new Date("2026-11-24T00:00:00Z"),
        validUntil: new Date("2026-11-30T23:59:59Z"),
        active: true,
      },
    ],
  });

  await prisma.gift.createMany({
    data: [
      {
        name: "Munhequeira Núcleo",
        description: "Munhequeira elástica protetora",
        minPurchaseValue: 250.0,
        stockQuantity: 45,
        active: true,
      },
      {
        name: "Squeeze 500ml",
        description: "Garrafa térmica esportiva",
        minLoyaltyPoints: 200,
        stockQuantity: 30,
        active: true,
      },
    ],
  });

  // 11. Pedidos (Vendas)
  // Pedido 1: Marina Souza
  const order1 = await prisma.order.create({
    data: {
      customerId: custMarina.id,
      sellerId: seller.id,
      storeId: store.id,
      status: OrderStatus.PAID,
      subtotal: 249.9,
      total: 249.9,
      createdAt: new Date("2026-08-29T14:15:00Z"),
      items: {
        create: [
          {
            variantId: varLeggingP.id,
            quantity: 1,
            unitPrice: 149.9,
            subtotal: 149.9,
          },
          {
            variantId: varShortM.id,
            quantity: 1,
            unitPrice: 99.9,
            subtotal: 99.9,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.PIX,
          amount: 249.9,
          status: PaymentStatus.APPROVED,
          paidAt: new Date("2026-08-29T14:16:00Z"),
        },
      },
    },
  });

  // Pedido 2: Rafael Lima
  await prisma.order.create({
    data: {
      customerId: custRafael.id,
      sellerId: seller.id,
      storeId: store.id,
      status: OrderStatus.PAID,
      subtotal: 389.7,
      total: 389.7,
      createdAt: new Date("2026-08-28T16:30:00Z"),
      items: {
        create: [
          {
            variantId: varWheyChoc.id,
            quantity: 2,
            unitPrice: 179.9,
            subtotal: 359.8,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.CREDIT_CARD,
          amount: 389.7,
          installments: 3,
          status: PaymentStatus.APPROVED,
          paidAt: new Date("2026-08-28T16:32:00Z"),
        },
      },
    },
  });

  // Pedido 3: Beatriz Alves
  await prisma.order.create({
    data: {
      customerId: custBeatriz.id,
      sellerId: seller.id,
      storeId: store.id,
      status: OrderStatus.SHIPPED,
      subtotal: 129.0,
      total: 129.0,
      createdAt: new Date("2026-08-27T10:00:00Z"),
      items: {
        create: [
          {
            variantId: varCamisetaG.id,
            quantity: 1,
            unitPrice: 79.9,
            subtotal: 79.9,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.DEBIT_CARD,
          amount: 129.0,
          status: PaymentStatus.APPROVED,
          paidAt: new Date("2026-08-27T10:02:00Z"),
        },
      },
    },
  });

  // Pedido 4: João Pedro
  await prisma.order.create({
    data: {
      customerId: custJoao.id,
      sellerId: seller.id,
      storeId: store.id,
      status: OrderStatus.PAID,
      subtotal: 512.4,
      total: 512.4,
      createdAt: new Date("2026-08-26T18:20:00Z"),
      items: {
        create: [
          {
            variantId: varWheyChoc.id,
            quantity: 2,
            unitPrice: 179.9,
            subtotal: 359.8,
          },
          {
            variantId: varLeggingM.id,
            quantity: 1,
            unitPrice: 149.9,
            subtotal: 149.9,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.PIX,
          amount: 512.4,
          status: PaymentStatus.APPROVED,
          paidAt: new Date("2026-08-26T18:21:00Z"),
        },
      },
    },
  });

  // Pedido 5: Camila Rocha
  await prisma.order.create({
    data: {
      sellerId: seller.id,
      storeId: store.id,
      status: OrderStatus.COMPLETED,
      subtotal: 79.9,
      total: 79.9,
      createdAt: new Date("2026-08-25T11:45:00Z"),
      items: {
        create: [
          {
            variantId: varCamisetaG.id,
            quantity: 1,
            unitPrice: 79.9,
            subtotal: 79.9,
          },
        ],
      },
      payments: {
        create: {
          method: PaymentMethod.CASH,
          amount: 79.9,
          status: PaymentStatus.APPROVED,
          paidAt: new Date("2026-08-25T11:46:00Z"),
        },
      },
    },
  });

  // 12. Compras / Fornecedores
  await prisma.purchase.create({
    data: {
      supplierId: supMalharia.id,
      storeId: store.id,
      status: PurchaseStatus.RECEIVED,
      totalCost: 3120.0,
      notes: "Lote de reposição de leggings e camisetas",
      orderedAt: new Date("2026-08-20T09:00:00Z"),
      receivedAt: new Date("2026-08-23T14:00:00Z"),
      items: {
        create: [
          { variantId: varLeggingM.id, quantity: 20, unitCost: 55.0 },
          { variantId: varLeggingG.id, quantity: 20, unitCost: 55.0 },
          { variantId: varCamisetaG.id, quantity: 30, unitCost: 28.0 },
          { variantId: varShortM.id, quantity: 10, unitCost: 38.0 },
        ],
      },
    },
  });

  await prisma.purchase.create({
    data: {
      supplierId: supNutri.id,
      storeId: store.id,
      status: PurchaseStatus.PENDING,
      totalCost: 5400.0,
      notes: "Pedido mensal de suplementação e coqueteleiras",
      orderedAt: new Date("2026-08-28T10:00:00Z"),
      items: {
        create: [
          { variantId: varWheyChoc.id, quantity: 50, unitCost: 85.0 },
        ],
      },
    },
  });

  // 13. Despesas
  await prisma.expense.createMany({
    data: [
      {
        storeId: store.id,
        category: ExpenseCategory.RENT,
        description: "Loja física — Setembro",
        amount: 4200.0,
        recurring: true,
        dueDate: new Date("2026-09-05T00:00:00Z"),
        loggedById: admin.id,
      },
      {
        storeId: store.id,
        category: ExpenseCategory.MARKETING,
        description: "Impulsionamento Instagram",
        amount: 850.0,
        recurring: false,
        dueDate: new Date("2026-09-01T00:00:00Z"),
        paidAt: new Date("2026-08-28T10:00:00Z"),
        loggedById: admin.id,
      },
      {
        storeId: store.id,
        category: ExpenseCategory.SALARY,
        description: "Folha de pagamento",
        amount: 9800.0,
        recurring: true,
        dueDate: new Date("2026-09-05T00:00:00Z"),
        loggedById: admin.id,
      },
      {
        storeId: store.id,
        category: ExpenseCategory.LOGISTICS,
        description: "Transportadora — lote agosto",
        amount: 610.0,
        recurring: false,
        dueDate: new Date("2026-08-30T00:00:00Z"),
        paidAt: new Date("2026-08-29T15:00:00Z"),
        loggedById: admin.id,
      },
    ],
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
