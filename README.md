# Painel — Loja Fit

Dashboard de gestão (estoque, vendas, financeiro, clientes, cupons e brindes)
para uma loja de moda fitness, construído em Next.js 14 (App Router) +
Prisma + PostgreSQL, já pensado para crescer além de roupa (ex.: whey,
acessórios) sem precisar redesenhar o banco.

## Rodando localmente

```bash
npm install
cp .env.example .env        # ajuste DATABASE_URL
npx prisma migrate dev      # cria as tabelas a partir de prisma/schema.prisma
npm run prisma:seed         # popula o banco com dados iniciais de exemplo
npm run dev
```

O app abre em `http://localhost:3000`. Todas as páginas já consultam o banco de dados via Prisma (`lib/prisma.ts`).

## Por que o banco foi modelado assim

- **Catálogo genérico.** `Category`, `Attribute`/`AttributeValue` e
  `ProductVariant` não têm nada de "roupa" fixado no schema. Uma legging
  vira uma variante por tamanho+cor; um whey de 900g vira uma variante
  única com atributos "sabor"/"peso". Vender um produto novo nunca exige
  migração — só um cadastro.
- **Estoque é histórico, não um número solto.** Toda entrada ou saída
  (venda, compra, devolução, ajuste manual) grava um `StockMovement`. Isso
  dá rastreabilidade real (quem tirou, quando, por quê) em vez de um campo
  que qualquer bug pode "mentir".
- **Financeiro em três fontes que se somam.** `Order` (o que entra),
  `Purchase` (compra de mercadoria) e `Expense` (aluguel, marketing,
  salários...) — juntas dão o fluxo de caixa completo sem misturar
  conceitos diferentes numa tabela só.
- **Cupom e brinde são coisas separadas.** Cupom desconta na hora da
  venda (`Coupon` ligado a `Order`); brinde é um item físico entregue
  (`Gift`/`OrderGift`), que pode ser automático por valor de compra ou
  resgatado com pontos de fidelidade (`Customer.loyaltyPoints`).
- **Multi-loja/filial já cabe.** `Store` existe desde já e é opcional em
  quase todo lugar — hoje roda com uma loja só, mas abrir uma segunda loja
  ou separar estoque online/físico não vai exigir reescrever nada.

## Estrutura

```
app/
  page.tsx            → visão geral (KPIs, receita x gastos, formas de pagamento)
  produtos/           → catálogo
  estoque/            → movimentações e alertas de reposição
  vendas/             → pedidos e pagamentos
  clientes/           → CRM básico + fidelidade
  cupons/             → cupons de desconto e brindes
  financeiro/         → receita, gastos, margem
  compras/            → compras a fornecedores
components/           → Sidebar, cards de métrica, gráficos (recharts), tabelas
lib/
  mock-data.ts        → dados de exemplo (trocar por queries reais)
  prisma.ts           → client singleton do Prisma
prisma/
  schema.prisma       → modelo de dados completo, comentado
  seed.ts             → script de seed com dados iniciais do sistema
```

## Próximos passos sugeridos

1. Autenticação (NextAuth ou Clerk) usando o `User.role` já modelado
   (ADMIN / MANAGER / SELLER) para controlar quem vê o financeiro.
2. Formulários de cadastro (produto, cliente, cupom, compra) — hoje só os
   botões existem como placeholder.
3. Formulários de cadastro (produto, cliente, cupom, compra) — hoje só os
   botões existem como placeholder.
4. Relatórios exportáveis (PDF/Excel) usando os mesmos dados do financeiro.
5. Quando a loja quiser vender online: reaproveitar `Product`/`ProductVariant`
   direto num storefront, já que não têm nada de "admin" embutido.
