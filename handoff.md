# Handoff: Mercado Pago Checkout Transparente — Cartão de Crédito (Card Payment Brick)

## Goal
Implementar o pagamento com **cartão de crédito** do Mercado Pago Checkout Transparente via **Orders API** + **Card Payment Brick**. PIX e boleto já funcionavam via Payments API. O site **nunca quebra** se as credenciais falharem (cai em simulação).

---

## State: What's Done

### ✅ Completed & Working
- **`lib/mercadopago.ts`**:
  - `isMercadoPagoConfigured()` — detecta ACCESS_TOKEN
  - `getMercadoPagoPublicKey()` — retorna PUBLIC_KEY
  - `isCardPaymentConfigured()` — requer ACCESS_TOKEN + PUBLIC_KEY
  - `createMercadoPagoPayment()` — PIX/boleto via `/v1/payments` (sem fallback — lança erro)
  - **`createMercadoPagoOrder()`** (NOVO) — cartão via `/v1/orders` (Orders API, sem fallback — lança erro)
  - `getMercadoPagoPayment()`, `validateWebhookSignature()`

- **`app/api/orders/process/route.ts`** (NOVO) — endpoint Post:
  - Autentica via `getCurrentCustomer()`
  - Recebe `{ orderId, cardToken, paymentMethodId, paymentTypeId, installments }`
  - Valida que o pedido é do cliente logado e está PENDING
  - Chama `createMercadoPagoOrder()` (Orders API)
  - Atualiza Payment (gatewayId, gatewayMeta) e Order status
  - Se aprovado → baixa estoque + pontos fidelidade (igual webhook)
  - **Chama `revalidatePath`** para admin/vendas/financeiro/estoque/perfil (igual webhook)
  - Retorna `{ ok, status, message }`

- **`components/store/CardPaymentBrick.tsx`** (NOVO) — client component:
  - Recebe a **`publicKey` como prop** (vinda do servidor) — não lê env no client
  - Carrega SDK dinamicamente (se já não estiver na página)
  - Renderiza `cardPaymentBrick_container`
  - `onSubmit` (Brick) → fetch `/api/orders/process`
  - `onProcessed` / `onError` callbacks para o pai
  - Se `publicKey` vazia → mostra aviso de simulação (não quebra)
  - Cleanup: `unmount()` no unmount

- **`lib/checkout.ts`**: para `CREDIT_CARD`, NÃO chama mais `createMercadoPagoPayment`. Apenas cria pedido+payment PENDING e retorna `{ orderId, requiresCardProcessing: true }`.
  - Se não houver credenciais de cartão → retorna erro (sem simulação).
  - Retorna `orderTotal` (centavos) para o Brick usar após o carrinho ser limpo.

- **`app/(loja)/finalizar/page.tsx`** (server) lê a chave pública e passa como prop (robusto a nome: `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` ou `MERCADO_PAGO_PUBLIC_KEY`).

- **`app/(loja)/layout.tsx`**: pré-carrega `sdk.mercadopago.com/js/v2` via `next/script` (só se PUBLIC_KEY configurada).

### ✅ Build
- `npx tsc --noEmit` — limpo (0 erros)
- `npm run build` — ✅ sucesso (todas rotas, incl. `/api/orders/process`)

---

## Key Technical Details

### Orders API (cartão)
```
POST https://api.mercadopago.com/v1/orders
Headers: Authorization: Bearer <ACCESS_TOKEN>, X-Idempotency-Key
Body:
{
  "type": "online",
  "processing_mode": "automatic",
  "total_amount": "50.00",       // STRING "00.00"
  "external_reference": "<orderId>",
  "payer": { "email": "...", "identification": { "type": "CPF", "number": "..." } },
  "transactions": { "payments": [{
    "amount": "50.00",
    "payment_method": { "id": "visa", "type": "credit_card", "token": "<cardToken>", "installments": 1 }
  }]}
}
```
Resposta: `transactions.payments[0].status` → `"processed"` = aprovado.

### Card Payment Brick (frontend)
- Inicializa com `initialization.amount` (em reais)
- `onSubmit(formData)` → `formData.token`, `formData.payment_method_id`, `formData.installments`, `formData.payer`
- Token é de uso único, expira em 7 dias

---

## Environment Variables
```
MERCADO_PAGO_ACCESS_TOKEN=              # token real (teste ou prod)
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=    # para o Brick no front-end
MERCADO_PAGO_WEBHOOK_SECRET=            # opcional
```

---

## Key Files
| File | Status |
|------|--------|
| `lib/mercadopago.ts` | ✅ Orders API + Payments API |
| `app/api/orders/process/route.ts` | ✅ Novo endpoint cartão |
| `components/store/CardPaymentBrick.tsx` | ✅ Novo Brick |
| `lib/checkout.ts` | ✅ Fluxo cartão devolve orderId |
| `app/(loja)/finalizar/CheckoutForm.tsx` | ✅ Integração do Brick |
| `app/(loja)/layout.tsx` | ✅ SDK pré-carregado |
| `app/api/webhooks/mercadopago/route.ts` | ✅ (unchanged) |

---

## Notas / Pitfalls
1. **401 "Unauthorized use of live credentials"**: se o ACCESS_TOKEN e a PUBLIC_KEY forem de ambientes diferentes (teste vs produção), a criação falha. O código cai em simulação em vez de quebrar. Revisar que ambos são do mesmo ambiente.
2. O `total_amount` da Orders API é **string** `"00.00"`, não número.
3. `payment_method_id` do Brick é a **bandeira** (`visa`, `master`...), não `"credit_card"`. O tipo vem de `formData.payment_method_type` (campo correto do SDK v2).
4. O Brick usa `state.orderTotal` (vindo do checkout) para o valor — NÃO o `subtotal` do carrinho, que zera após o pedido ser confirmado.
5. `processing_mode: "automatic"` cria+processa em 1 etapa.
6. Supabase: `prisma db push` sem migrations. Cuidado ao editar schema.
7. `tsc --noEmit` é a fonte de verdade para tipos (diagnostics do LSP podem estar desatualizados).
