// =============================================================================
// MERCADO PAGO — Checkout Transparente via Orders API (PIX, Boleto, Cartão)
// =============================================================================
// Este módulo gerencia a criação e consulta de pagamentos via Mercado Pago
// usando a Orders API (recomendada). Requer credenciais no .env:
// - MERCADO_PAGO_ACCESS_TOKEN (sempre, servidor)
// - NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY (cartão, frontend)
// - MERCADO_PAGO_WEBHOOK_SECRET (opcional, validação de assinatura)
// =============================================================================

// ---------------------------------------------------------------------------
// Dependências
// ---------------------------------------------------------------------------

import { isValidCpf } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Método de pagamento aceito no checkout */
export type PaymentType = "pix" | "credit_card" | "boleto";

/** Resultado normalizado retornado ao checkout */
export interface CheckoutPaymentResult {
  /** Método de pagamento escolhido */
  method: "PIX" | "CREDIT_CARD" | "BOLETO";
  /** ID do pagamento do Mercado Pago (ex.: PAY01J...) — usado no webhook */
  externalPaymentId: string;
  /** ID da order do Mercado Pago (ex.: ORD01J...) — para consultas via /v1/orders */
  mpOrderId: string;
  /** Código PIX "copia e cola" */
  pixCode?: string;
  /** QR Code do PIX em base64 */
  pixQrCodeBase64?: string;
  /** URL do boleto */
  boletoUrl?: string;
  /** Quantidade de parcelas (cartão) */
  installments?: number;
}

/** Resposta de erro padronizada do Mercado Pago */
interface MercadoPagoErrorResponse {
  message?: string;
  error?: string;
  cause?: Array<{ description?: string }> | string;
}

/** Resposta da Orders API (create order / get order) */
interface MercadoPagoOrderResponse {
  id: string; // ORD01J...
  type: string;
  processing_mode: string;
  total_amount: string;
  total_paid_amount?: string;
  external_reference: string;
  status: string; // "processed" | "pending" | "cancelled" | "rejected"
  status_detail?: string;
  country_code?: string;
  created_date: string;
  last_updated_date: string;
  transactions?: {
    payments: Array<{
      id: string; // PAY01J...
      amount: string;
      paid_amount?: string;
      reference_id?: string;
      status: string; // "processed" | "pending" | "rejected" | "cancelled"
      status_detail?: string;
      payment_method?: {
        id: string; // "pix", "bolbradesco", "visa", "master", ...
        type: string; // "bank_transfer", "ticket", "credit_card", "debit_card"
        token?: string;
        installments?: number;
        // Campos PIX
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
        e2e_id?: string;
        // Campos boleto
        barcode_content?: string;
        digitable_line?: string;
      };
      date_of_expiration?: string;
    }>;
  };
  payer?: {
    email: string;
    identification?: { type: string; number: string };
  };
}

/** Payload do webhook do Mercado Pago */
interface MercadoPagoWebhookPayload {
  action: string; // "order.created" | "order.updated" | "payment.created" | "payment.updated"
  api_version: string;
  application_id: string;
  date_created: string;
  id: string; // notification id (não o payment id)
  live_mode: boolean;
  type: string; // "order" | "payment"
  user_id: number;
  data: {
    id: string; // ORD... (order) ou PAY... (payment) dependendo do type
    order_id?: string; // presente em notificações de payment
  };
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const ACCESS_TOKEN = (process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "").trim();
const PUBLIC_KEY = (
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ??
  process.env.MERCADO_PAGO_PUBLIC_KEY ??
  ""
).trim();
const WEBHOOK_SECRET = (process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "").trim();

// ---------------------------------------------------------------------------
// Helpers de erro
// ---------------------------------------------------------------------------

/**
 * Extrai a mensagem legível de um corpo de erro do Mercado Pago.
 */
function extractMpError(text: string): string {
  try {
    const parsed = JSON.parse(text) as MercadoPagoErrorResponse;
    return (
      parsed?.message ??
      parsed?.error ??
      (typeof parsed === "string" ? parsed : text)
    );
  } catch {
    return text;
  }
}

/**
 * Converte a resposta de erro da API do Mercado Pago numa mensagem legível
 * e acionável, incluindo orientação específica para o 401 de credenciais
 * misturadas (teste × produção) ou credenciais inválidas na Orders API.
 */
export function parseMercadoPagoError(
  status: number,
  rawText: string,
  context: string
): Error {
  const detail = extractMpError(rawText);

  console.error(`[MercadoPago] ${context} — ${status}:`, rawText);

  // 401 na Orders API: credenciais inválidas ou app não homologado
  if (status === 401) {
    const c = getMercadoPagoCredentialInfo();

    // Erro "invalid_credentials": Orders API não suporta credenciais de teste separadas
    // -> usar usuários de teste com credenciais de produção (APP_USR- do app)
    if (/invalid_credentials/i.test(rawText)) {
      return new Error(
        "Credenciais inválidas para a Orders API. A Orders API usa as credenciais " +
          "de produção do aplicativo (APP_USR-...). Para testar em sandbox, crie " +
          "uma conta de teste compradora (email @testuser.com) no painel do app e " +
          "use-a como pagador. Não existem credenciais de teste separadas (TEST-...) " +
          "para a Orders API."
      );
    }

    // "Unauthorized use of live credentials" => token APP_USR- mas app não ativado p/ produção
    if (/live credentials/i.test(rawText)) {
      return new Error(
        "Credencial de PRODUÇÃO (APP_USR-) em uso, mas o aplicativo ainda não foi " +
          "ativado para produção no painel do Mercado Pago (homologação pendente). " +
          "Para testar em sandbox, o app PRECISA estar ativado para produção. " +
          "Ative em: Developers > Sua aplicação > Credenciais de produção > Ativar."
      );
    }

    // Outros 401: mistura de ambientes ou token incorreto
    const hint =
      c.accessTokenMode !== "unknown" && c.publicKeyMode !== "unknown"
        ? ` (ACCESS_TOKEN: ${c.accessTokenMode}, PUBLIC_KEY: ${c.publicKeyMode})`
        : "";
    return new Error(
      `Credenciais do Mercado Pago não autorizadas (401).${hint} ` +
        `Verifique se o ACCESS_TOKEN está correto e se o app está ativo para produção ` +
        `no painel do Mercado Pago (para testar em sandbox, o app precisa estar ativado).`
    );
  }

  if (status === 400 || status === 422) {
    return new Error(
      `Mercado Pago recusou o pagamento (${status}): ${detail}`
    );
  }

  // Erro específico: email de sandbox inválido
  if (/invalid_email_for_sandbox/i.test(rawText)) {
    return new Error(
      "Email inválido para ambiente de sandbox. O email do pagador deve ser " +
        "de uma conta de teste compradora (formato test_user_xxx@testuser.com). " +
        "Crie uma conta de teste no painel do Mercado Pago."
    );
  }

  return new Error(`Erro no Mercado Pago (${status}): ${detail}`);
}

/**
 * Retorna true se o Mercado Pago estiver configurado com credenciais reais.
 */
export function isMercadoPagoConfigured(): boolean {
  return ACCESS_TOKEN.length > 0;
}

/**
 * Retorna a chave pública (usada no front-end pelo Card Payment Brick).
 */
export function getMercadoPagoPublicKey(): string {
  return PUBLIC_KEY;
}

/**
 * Retorna true se o card payment (Orders API + Brick) está totalmente
 * configurado: precisa da ACCESS_TOKEN (backend) e da PUBLIC_KEY (frontend).
 */
export function isCardPaymentConfigured(): boolean {
  return ACCESS_TOKEN.length > 0 && PUBLIC_KEY.length > 0;
}

/**
 * Diagnóstico das credenciais (nunca expõe o token completo).
 * Para a Orders API, o prefixo APP_USR- indica credencial de produção do app
 * (que também é usada para testar em sandbox). TEST- é o modelo antigo (Payments API).
 */
export function getMercadoPagoCredentialInfo(): {
  hasAccessToken: boolean;
  accessTokenMode: "orders" | "legacy-test" | "unknown";
  hasPublicKey: boolean;
  publicKeyMode: "orders" | "legacy-test" | "unknown";
} {
  const modeOf = (v: string): "orders" | "legacy-test" | "unknown" =>
    v.startsWith("APP_USR-")
      ? "orders"          // Orders API usa credencial de produção do app (também p/ sandbox)
      : v.startsWith("TEST-")
        ? "legacy-test"   // Payments API legacy
        : "unknown";
  return {
    hasAccessToken: ACCESS_TOKEN.length > 0,
    accessTokenMode: modeOf(ACCESS_TOKEN),
    hasPublicKey: PUBLIC_KEY.length > 0,
    publicKeyMode: modeOf(PUBLIC_KEY),
  };
}

// ---------------------------------------------------------------------------
// Helpers de payload (Orders API)
// ---------------------------------------------------------------------------

/**
 * Normaliza um base64 de imagem vindo da API. A Orders API devolve o
 * qr_code_base64 sem o prefixo `data:image/png;base64,` — sem ele o <img>
 * renderiza em branco. Se já vier com prefixo data URI, mantém como está.
 */
function normalizeImageDataUri(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^data:image\//i.test(trimmed)
    ? trimmed
    : `data:image/png;base64,${trimmed}`;
}

/**
 * Normaliza o estado (UF) para o padrão de 2 letras exigido pela API.
 * Aceita "SP", "São Paulo (SP)", "SP - São Paulo" etc.
 */
function normalizeUf(value?: string): string | undefined {
  if (!value) return undefined;
  const s = value.trim().toUpperCase();
  const match = s.match(/\(([A-Z]{2})\)/) ?? s.match(/\b[A-Z]{2}\b/);
  return match?.[1] ?? match?.[0] ?? s.slice(0, 2);
}

/**
 * Monta o objeto `payer` da Orders API a partir dos dados do cliente.
 * Nome completo e endereço são obrigatórios para boleto e ajudam na taxa
 * de aprovação dos demais métodos.
 */
function buildPayerObject(params: {
  email: string;
  cpf?: string;
  name?: string;
  address?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
  };
}): Record<string, unknown> {
  const payer: Record<string, unknown> = { email: params.email };

  if (params.cpf) {
    payer.identification = {
      type: "CPF",
      number: params.cpf.replace(/\D/g, ""),
    };
  }

  const nameParts = (params.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (nameParts.length > 0) {
    payer.first_name = nameParts[0];
    payer.last_name = nameParts.slice(1).join(" ") || nameParts[0];
  }

  if (params.address) {
    const zip = params.address.zipCode?.replace(/\D/g, "") ?? "";
    payer.address = {
      zip_code: zip.length === 8 ? zip : undefined,
      street_name: params.address.street ?? undefined,
      street_number: params.address.number ?? undefined,
      complement: params.address.complement ?? undefined,
      neighborhood: params.address.district ?? undefined,
      city: params.address.city ?? undefined,
      state: normalizeUf(params.address.state),
    };
  }

  return payer;
}

// ---------------------------------------------------------------------------
// Criação de pagamento via Orders API
// ---------------------------------------------------------------------------

/**
 * Cria uma Order no Mercado Pago via Orders API para PIX, boleto ou cartão.
 * Lança erro se a API falhar (sem fallback de simulação).
 *
 * @param params - Parâmetros do pagamento
 * @param params.amount - Valor em centavos
 * @param params.description - Descrição para o pagamento
 * @param params.method - "PIX" | "CREDIT_CARD" | "BOLETO"
 * @param params.payerEmail - Email do pagador (em sandbox: @testuser.com)
 * @param params.orderId - ID do pedido (external_reference)
 * @param params.installments - Parcelas (apenas para cartão)
 * @param params.cardToken - Token do cartão (apenas cartão)
 * @param params.paymentMethodId - ID do meio de pagamento (ex.: "pix", "bolbradesco", "visa", "master")
 * @param params.paymentTypeId - Tipo do meio ("bank_transfer", "ticket", "credit_card", "debit_card")
 */
export async function createMercadoPagoPayment(params: {
  amount: number; // centavos
  description: string;
  method: "PIX" | "CREDIT_CARD" | "BOLETO";
  payerEmail: string;
  payerCpf?: string;
  payerName?: string;
  payerAddress?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
  };
  orderId: string; // external_reference
  installments?: number;
  cardToken?: string;
  paymentMethodId?: string;
  paymentTypeId?: string;
}): Promise<CheckoutPaymentResult> {
  const {
    amount,
    description,
    method,
    payerEmail,
    payerCpf,
    payerName,
    payerAddress,
    orderId,
    installments,
    cardToken,
    paymentMethodId,
    paymentTypeId,
  } = params;

  // Garante que tem credenciais configuradas
  if (!isMercadoPagoConfigured()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente");
  }

  // Mapeia método interno para payment_method da Orders API
  let mpPaymentMethodId: string;
  let mpPaymentTypeId: string;

  // Boleto exige nome completo, CPF válido e endereço do pagador na Orders API.
  // Falha rápido com mensagem amigável (o checkout cancela o pedido no catch).
  if (method === "BOLETO") {
    const missing: string[] = [];
    if (!payerName?.trim()) missing.push("nome completo");
    if (!payerCpf || !isValidCpf(payerCpf)) missing.push("CPF válido");
    const zipDigits = payerAddress?.zipCode?.replace(/\D/g, "") ?? "";
    if (
      zipDigits.length !== 8 ||
      !payerAddress?.street ||
      !payerAddress?.number ||
      !payerAddress?.city ||
      !normalizeUf(payerAddress?.state)
    ) {
      missing.push("endereço de entrega completo (rua, número, cidade, UF e CEP)");
    }
    if (missing.length > 0) {
      throw new Error(
        `Pagamento com boleto exige ${missing.join(", ")}. Preencha em /perfil.`
      );
    }
  }

  if (method === "PIX") {
    mpPaymentMethodId = "pix";
    mpPaymentTypeId = "bank_transfer";
  } else if (method === "BOLETO") {
    mpPaymentMethodId = "bolbradesco";
    mpPaymentTypeId = "ticket";
  } else {
    // CARTÃO — valores vindos do Brick (front-end)
    mpPaymentMethodId = paymentMethodId ?? "visa";
    mpPaymentTypeId = paymentTypeId ?? "credit_card";
  }

  const total = (amount / 100).toFixed(2);
  const idempotencyKey = `order-${orderId}-${Date.now()}`;

  // Diagnóstico de ambiente — aparece nos logs do Vercel
  console.log(
    "[MercadoPago] Criando order (payment) — credenciais:",
    JSON.stringify(getMercadoPagoCredentialInfo())
  );

  const body = {
    type: "online",
    processing_mode: "automatic",
    total_amount: total,
    external_reference: orderId,
    description,
    payer: buildPayerObject({
      email: payerEmail,
      cpf: payerCpf,
      name: payerName,
      address: payerAddress,
    }),
    transactions: {
      payments: [
        {
          amount: total,
          payment_method: {
            id: mpPaymentMethodId,
            type: mpPaymentTypeId,
            ...(method === "CREDIT_CARD" && cardToken
              ? { token: cardToken, installments: installments ?? 1 }
              : {}),
          },
        },
      ],
    },
  };

  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw parseMercadoPagoError(response.status, err, "criar order (payment)");
  }

  const data: MercadoPagoOrderResponse = await response.json();
  const payment = data?.transactions?.payments?.[0];
  const paymentMethod = payment?.payment_method as Record<string, unknown> | undefined;

  return {
    method,
    externalPaymentId: String(payment?.id ?? data?.id ?? `pay-${orderId.slice(-8)}`),
    mpOrderId: String(data?.id ?? payment?.id ?? `ord-${orderId.slice(-8)}`),
    pixCode: typeof paymentMethod?.qr_code === "string" ? paymentMethod.qr_code : undefined,
    pixQrCodeBase64: normalizeImageDataUri(
      typeof paymentMethod?.qr_code_base64 === "string"
        ? paymentMethod.qr_code_base64
        : undefined
    ),
    boletoUrl: typeof paymentMethod?.ticket_url === "string" ? paymentMethod.ticket_url : undefined,
    installments: method === "CREDIT_CARD" ? (installments ?? 1) : undefined,
  };
}

/**
 * Cria uma Order no Mercado Pago via Orders API para pagamento com cartão.
 * Mantida para compatibilidade com o fluxo de cartão existente (Card Payment Brick).
 *
 * @returns Dados normalizados da transação criada.
 */
export async function createMercadoPagoOrder(params: {
  amount: number; // centavos
  description: string;
  orderId: string; // external_reference
  cardToken: string;
  paymentMethodId: string; // ex.: "visa", "master"
  paymentTypeId: string; // "credit_card" | "debit_card"
  installments: number;
  payerEmail: string;
  payerCpf?: string;
  payerName?: string;
  payerAddress?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
  };
}): Promise<{
  gatewayId: string;        // payment ID (PAY...)
  mpOrderId: string;        // order ID (ORD...)
  status: string;
  statusDetail?: string;
}> {
  if (!isMercadoPagoConfigured()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente");
  }

  const total = (params.amount / 100).toFixed(2);
  const idempotencyKey = `order-${params.orderId}-${Date.now()}`;

  try {
    console.log(
      "[MercadoPago] Criando order (cartão) — credenciais:",
      JSON.stringify(getMercadoPagoCredentialInfo())
    );

    const response = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        type: "online",
        processing_mode: "automatic",
        total_amount: total,
        external_reference: params.orderId,
        description: params.description,
        payer: buildPayerObject({
          email: params.payerEmail,
          cpf: params.payerCpf,
          name: params.payerName,
          address: params.payerAddress,
        }),
        transactions: {
          payments: [
            {
              amount: total,
              payment_method: {
                id: params.paymentMethodId,
                type: params.paymentTypeId,
                token: params.cardToken,
                installments: params.installments,
              },
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw parseMercadoPagoError(response.status, err, "criar order (cartão)");
    }

    const data = (await response.json()) as MercadoPagoOrderResponse;
    const payment = data?.transactions?.payments?.[0];

    return {
      gatewayId: String(payment?.id ?? `pay-${params.orderId.slice(-8)}`),
      mpOrderId: String(data?.id ?? `ord-${params.orderId.slice(-8)}`),
      status: payment?.status ?? data?.status ?? "pending",
      statusDetail: payment?.status_detail ?? data?.status_detail,
    };
  } catch (error) {
    console.error("[MercadoPago] Exceção ao criar order (cartão):", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Consulta de status via Orders API
// ---------------------------------------------------------------------------

/**
 * Consulta o status de uma Order do Mercado Pago pelo ID (ORD...).
 * Usado pelo webhook para obter status atualizado quando a notificação
 * chega como "order.updated" ou "order.action_required".
 */
export async function getMercadoPagoOrderStatus(
  mpOrderId: string
): Promise<{ status: string; statusDetail?: string; paymentId?: string } | null> {
  if (!isMercadoPagoConfigured()) {
    return null;
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/orders/${mpOrderId}`,
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  if (!response.ok) return null;

  const data: MercadoPagoOrderResponse = await response.json();
  const payment = data?.transactions?.payments?.[0];

  return {
    status: payment?.status ?? data?.status ?? "pending",
    statusDetail: payment?.status_detail ?? data?.status_detail,
    paymentId: payment?.id,
  };
}

/**
 * Consulta o status de um pagamento pelo ID do Mercado Pago (legado /v1/payments).
 * Mantido para compatibilidade caso o webhook receba notificação de payment antigo.
 */
export async function getMercadoPagoPayment(
  mpPaymentId: string | number
): Promise<{ status: string; statusDetail: string; paymentId: string } | null> {
  if (!isMercadoPagoConfigured()) {
    return null;
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  if (!response.ok) return null;

  const data: MercadoPagoOrderResponse = await response.json();
  return {
    status: data.status,
    statusDetail: data.status_detail ?? "",
    paymentId: String(mpPaymentId),
  };
}

// ---------------------------------------------------------------------------
// Validação do webhook (Orders API)
// ---------------------------------------------------------------------------

/**
 * Valida o signature do webhook do Mercado Pago (Orders API).
 * O Mercado Pago envia: x-signature, x-request-id, e query param data.id.
 * Implementação HMAC-SHA256: ts=...,v1=...
 */
export function validateWebhookSignature(
  body: string,
  signature: string | null,
  requestId: string | null,
  dataId: string | null
): boolean {
  if (!WEBHOOK_SECRET) return true; // sem secret configurado -> aceita (dev)
  if (!signature || !requestId || !dataId) return false;

  try {
    // Formato: ts=123456789,v1=abc123...
    const parts = signature.split(",");
    let ts = "";
    let v1 = "";
    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "ts") ts = value;
      if (key === "v1") v1 = value;
    }
    if (!ts || !v1) return false;

    // Manifesto do que o MP assina: `${ts}.${requestId}.${dataId}`
    const manifest = `${ts}.${requestId}.${dataId}`;

    // HMAC-SHA256
    const crypto = require("crypto");
    const expectedV1 = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex");

    // Comparação em tempo constante
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedV1));
  } catch {
    return false;
  }
}

/** Valor em centavos — helper para converter de R$ para centavos */
export function toCents(valueBRL: number): number {
  return Math.round(valueBRL * 100);
}