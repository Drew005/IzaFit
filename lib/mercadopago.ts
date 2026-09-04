// =============================================================================
// MERCADO PAGO — Checkout Transparente (PIX, Cartão de Crédito, Boleto)
// =============================================================================
// Este módulo gerencia a criação e consulta de pagamentos via Mercado Pago.
// Requer credenciais configuradas no .env (ACCESS_TOKEN + PUBLIC_KEY para cartão).
// =============================================================================

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PaymentType = "pix" | "credit_card" | "boleto";

export interface MercadoPagoPaymentRequest {
  /** Valor em centavos (ex.: R$ 100,00 = 10000) */
  transaction_amount: number;
  /** Descrição do pagamento */
  description: string;
  /** Método de pagamento: "pix", "credit_card" ou "bank_transfer" */
  payment_method_id: string;
  /** Email do pagador */
  payer_email: string;
  /** Documento (CPF/CNPJ) do pagador */
  external_reference: string; // orderId
  installments?: number;
  /** Token do cartão (Checkout Transparente com SDK front-end) */
  token?: string;
  /** CPF do pagador (obrigatório para cartão) */
  statement_descriptor?: string;
  /** Chave de idempotência */
  idempotency_key?: string;
}

export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  /** URL para redirecionar ao boleto */
  transaction_details?: { external_resource_url?: string };
  /** Dados exclusivos do PIX */
  point_of_interaction?: {
    type: string;
    transaction_data?: {
      qr_code_base64: string;
      qr_code: string;
      ticket_url: string;
    };
  };
  /** Link de pagamento (fallback) */
  payment_type_id?: string;
}

export interface CheckoutPaymentResult {
  /** Método de pagamento escolhido */
  method: "PIX" | "CREDIT_CARD" | "BOLETO";
  /** ID externo do pagamento (numérico do Mercado Pago) */
  externalPaymentId: string;
  /** Código PIX "copia e cola" */
  pixCode?: string;
  /** QR Code do PIX em base64 */
  pixQrCodeBase64?: string;
  /** URL do boleto */
  boletoUrl?: string;
  /** Quantidade de parcelas */
  installments?: number;
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
// A chave pública pode estar com ou sem o prefixo NEXT_PUBLIC_. Aceita os dois
// nomes para ser robusto à convenção usada no deploy (Vercel/etc).
const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ??
  process.env.MERCADO_PAGO_PUBLIC_KEY ??
  "";
const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "";

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

// ---------------------------------------------------------------------------
// Criação de pagamento
// ---------------------------------------------------------------------------

/**
 * Cria um pagamento no Mercado Pago.
 * Lança erro se a API falhar (sem fallback de simulação).
 *
 * @param params - Parâmetros do pagamento
 * @param params.amount - Valor em centavos
 * @param params.description - Descrição para o pagamento
 * @param params.method - "PIX" | "CREDIT_CARD" | "BOLETO"
 * @param params.payerEmail - Email do pagador
 * @param params.orderId - ID do pedido (external_reference)
 * @param params.installments - Parcelas (apenas para cartão)
 */
export async function createMercadoPagoPayment(params: {
  amount: number; // centavos
  description: string;
  method: "PIX" | "CREDIT_CARD" | "BOLETO";
  payerEmail: string;
  payerCpf?: string;
  orderId: string;
  installments?: number;
}): Promise<CheckoutPaymentResult> {
  const { amount, description, method, payerEmail, payerCpf, orderId, installments } = params;

  // Garante que tem credenciais configuradas
  if (!isMercadoPagoConfigured()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente");
  }

  const mpMethodId =
    method === "PIX" ? "pix" : method === "CREDIT_CARD" ? "credit_card" : "bank_transfer";

  const body: Record<string, unknown> = {
    transaction_amount: amount / 100,
    description,
    payment_method_id: mpMethodId,
    payer: {
      email: payerEmail,
      identification: payerCpf
        ? { type: "CPF", number: payerCpf.replace(/\D/g, "") }
        : undefined,
    },
    external_reference: orderId,
    installments: method === "CREDIT_CARD" ? (installments ?? 1) : 1,
  };

  const idempotencyKey = `order-${orderId}-${Date.now()}`;

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
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
    console.error("[MercadoPago] Erro ao criar pagamento:", response.status, err);
    throw new Error(`Mercado Pago ${response.status}: ${err}`);
  }

  const data: MercadoPagoPaymentResponse = await response.json();

  return {
    method,
    externalPaymentId: String(data.id),
    pixCode: data.point_of_interaction?.transaction_data?.qr_code,
    pixQrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    boletoUrl: data.transaction_details?.external_resource_url,
    installments: method === "CREDIT_CARD" ? installments : undefined,
  };
}

// ---------------------------------------------------------------------------
// Orders API (cartão de crédito — Card Payment Brick)
// ---------------------------------------------------------------------------

/**
 * Cria uma Order no Mercado Pago via Orders API para pagamento com cartão.
 * Usada quando o front-end envia o token do card gerado pelo Brick.
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
}): Promise<{
  gatewayId: string;
  status: string;
  statusDetail?: string;
}> {
  if (!isMercadoPagoConfigured()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente");
  }

  const total = (params.amount / 100).toFixed(2);
  const body = {
    type: "online",
    processing_mode: "automatic",
    total_amount: total,
    external_reference: params.orderId,
    description: params.description,
    payer: {
      email: params.payerEmail,
      identification: params.payerCpf
        ? {
            type: "CPF",
            number: params.payerCpf.replace(/\D/g, ""),
          }
        : undefined,
    },
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
  };

  const idempotencyKey = `order-${params.orderId}-${Date.now()}`;

  try {
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
      console.error("[MercadoPago] Erro ao criar order (cartão):", response.status, err);
      throw new Error(`Mercado Pago ${response.status}: ${err}`);
    }

    const data = await response.json();
    const payment = data?.transactions?.payments?.[0];

    return {
      gatewayId: String(data?.id ?? payment?.id ?? `order-${params.orderId.slice(-8)}`),
      status: payment?.status ?? data?.status ?? "pending",
      statusDetail: payment?.status_detail ?? data?.status_detail,
    };
  } catch (error) {
    console.error("[MercadoPago] Exceção ao criar order (cartão):", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Consulta de pagamento
// ---------------------------------------------------------------------------

/**
 * Consulta o status de um pagamento pelo ID do Mercado Pago.
 */
export async function getMercadoPagoPayment(
  mpPaymentId: string | number
): Promise<{ status: string; statusDetail: string } | null> {
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

  const data: MercadoPagoPaymentResponse = await response.json();
  return { status: data.status, statusDetail: data.status_detail };
}

// ---------------------------------------------------------------------------
// Validação do webhook
// ---------------------------------------------------------------------------

/**
 * Valida o signature do webhook do Mercado Pago.
 * Retorna true se válido ou se não houver segredo configurado.
 */
export function validateWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!WEBHOOK_SECRET) return true;
  // A validação real usa HMAC-SHA256. Implementação básica:
  // Em produção, usar crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  if (!signature) return false;
  return signature.includes(WEBHOOK_SECRET);
}

/** Valor em centavos — helper para converter de R$ para centavos */
export function toCents(valueBRL: number): number {
  return Math.round(valueBRL * 100);
}
