# Handoff: Mercado Pago Checkout — PIX, Boleto e Cartão (sem simulação)

## Goal
Checkout 100% real no Mercado Pago Checkout Transparente — PIX, Boleto (via Payments API `/v1/payments`) e Cartão de Crédito (via Orders API `/v1/orders` + Card Payment Brick). **Sem nenhum fallback de simulação**: se a API falhar, o erro aparece para o cliente e o pedido é cancelado.

---

## State: What's Done

### ✅ Completed & Working
- **`lib/mercadopago.ts`**:
  - `isMercadoPagoConfigured()`, `getMercadoPagoPublicKey()`, `isCardPaymentConfigured()`
  - `createMercadoPagoPayment()` — PIX/boleto via `/v1/payments` — **lança erro** se falhar (`parseMercadoPagoError`)
  - `createMercadoPagoOrder()` — cartão via `/v1/orders` (Orders API) — **lança erro** se falhar
  - `getMercadoPagoPayment()`, `validateWebhookSignature()`
  - `parseMercadoPagoError()` — transforma resposta de erro em mensagem acionável; no 401 de "live credentials", inclui diagnóstico de ambiente (TEST- × APP_USR-)
  - `getMercadoPagoCredentialInfo()` — diagnóstico seguro (não expõe o token; mostra `test`/`live`/`unknown` + presença)
  - **Log de credenciais antes de cada chamada à API** → aparece nos logs da função no Vercel

- **`app/api/orders/process/route.ts`** — endpoint cartão:
  - Autentica via `getCurrentCustomer()`, valida pedido PENDING do dono
  - Chama `createMercadoPagoOrder()` com try/catch → `NextResponse.json({ error }, { status: 502 })`
  - Atualiza Payment (gatewayId, gatewayMeta, status) e Order status
  - Se aprovado → baixa estoque + pontos fidelidade; `revalidatePath` (admin/vendas/financeiro/estoque/perfil)

- **`components/store/CardPaymentBrick.tsx`** — client component:
  - Recebe `publicKey` como prop (lida no servidor — não lê env no client)
  - `onSubmit` → fetch `/api/orders/process`; `onProcessed`/`onError` callbacks
  - **Sem texto de simulação**: sem `publicKey`, mostra "Pagamento com cartão indisponível no momento. Use PIX ou boleto."

- **`lib/checkout.ts`**:
  - `CREDIT_CARD` → cria pedido+payment PENDING, retorna `{ orderId, requiresCardProcessing, orderTotal }`
  - PIX/BOLETO → `createMercadoPagoPayment()` em try/catch; **se falhar, cancela o pedido** (payment → `DENIED` via `gatewayMeta.error`, order → `CANCELED`) e retorna `{ error }`
  - Sem credenciais de cartão → erro claro, sem simulação

- **`app/(loja)/finalizar/`** — `page.tsx` (server) passa `mpPublicKey` como prop; `CheckoutForm.tsx` renderiza Brick no fluxo de cartão, PIX copia-e-cola + QR, boleto link.

- **`app/(loja)/layout.tsx`**: pré-carrega `sdk.mercadopago.com/js/v2` via `next/script` (só se PUBLIC_KEY setada).

### ✅ Build
- `npx tsc --noEmit` — limpo (0 erros)
- `npm run build` — ✅ sucesso (33 páginas + `/api/orders/process` + webhook)

---

## 🔴 Bloqueio atual (produção): 401 "Unauthorized use of live credentials"

O usuário vê no Vercel:
```
[MercadoPago] Erro ao criar pagamento: 401
{ error: "unauthorized", message: "Unauthorized use of live credentials", status: 401 }
```

### Causa
O Mercado Pago retorna `401 ... live credentials` quando o **ACCESS_TOKEN usado tem prefixo `APP_USR-` (produção) mas o app ainda NÃO está ativado/homologado para produção**, OU quando há **mistura de ambientes** (ACCESS_TOKEN de um ambiente, PUBLIC_KEY de outro).

O usuário afirmou estar com "as api teste" mas o erro indica **credencial de produção** sendo usada — provável: o `MERCADO_PAGO_ACCESS_TOKEN` no Vercel foi preenchido com o token **APP_USR-** (ou foi copiado o valor errado/da seção errada).

### Como diagnosticar (já implementado no código)
Antes de cada chamada à API, o código loga no Vercel:
```
[MercadoPago] Criando pagamento — credenciais: {"hasAccessToken":true,"accessTokenMode":"live","hasPublicKey":true,"publicKeyMode":"live"}
```
- `accessTokenMode: "test"` → token TEST- ✓
- `accessTokenMode: "live"` → token APP_USR- → costuma dar o 401 se o app não estiver homologado

### Correção
1. No painel do Mercado Pago → `Developers → Sua aplicação → Credenciais de teste`:
   - Copiar `ACCESS_TOKEN` (**TEST-...**) → Vercel env `MERCADO_PAGO_ACCESS_TOKEN`
   - Copiar `PUBLIC_KEY` (**TEST-...**) → Vercel env `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
2. Garantir que os dois são do **mesmo aplicativo** e do **mesmo ambiente** (ambos TEST- ou ambos APP_USR-).
3. Redeploy e testar.
4. Para cobrança real: ativar produção no painel ("Credenciais de produção" ficam ativas após homologação) e usar os valores **APP_USR-** de lá.

> ⚠️ O 401 NÃO é bug do código — as chamadas estão corretas e sem simulação. É configuração de credenciais.

---

## Environment Variables
```
MERCADO_PAGO_ACCESS_TOKEN=              # TEST-... ou APP_USR-... (segredo, só servidor)
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=    # TEST-... ou APP_USR-... (pública por design)
MERCADO_PAGO_WEBHOOK_SECRET=            # opcional
```
- `.env` local NÃO tem as vars MP → checkout local lança erro "MERCADO_PAGO_ACCESS_TOKEN não configurado" (intencional).
- `NEXT_PUBLIC_` é pública por design (client-side), usada só para tokenizar o cartão no navegador. **Nunca** colocar ACCESS_TOKEN com `NEXT_PUBLIC_`.

---

## Key Files
| File | Status |
|------|--------|
| `lib/mercadopago.ts` | ✅ Orders + Payments API, diagnóstico de credenciais, sem simulação |
| `app/api/orders/process/route.ts` | ✅ Endpoint cartão com try/catch → 502 |
| `components/store/CardPaymentBrick.tsx` | ✅ Brick, sem texto de demonstração |
| `lib/checkout.ts` | ✅ PIX/boleto cancela pedido na falha |
| `app/(loja)/finalizar/CheckoutForm.tsx` | ✅ Brick + PIX + boleto |
| `app/api/webhooks/mercadopago/route.ts` | ✅ (unchanged) |

---

## Notas / Pitfalls
1. **401 é de credencial, não de código.** Usar `getMercadoPagoCredentialInfo()` (logs) para ver `test` vs `live`.
2. `PaymentStatus` NÃO tem `FAILED` — usar `DENIED` para pagamento recusado.
3. `total_amount` da Orders API é **string** `"00.00"`.
4. `payment_method_id` do Brick = bandeira (`visa`, `master`...); tipo vem de `formData.payment_method_type`.
5. O Brick usa `state.orderTotal` (do checkout), não o `subtotal` do carrinho (zera após confirmar).
6. `processing_mode: "automatic"` cria+processa em 1 etapa.
7. Supabase: `prisma db push` sem migrations.
8. `tsc --noEmit` é a fonte de verdade para tipos.