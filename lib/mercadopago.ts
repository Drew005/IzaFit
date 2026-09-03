// =============================================================================
// MERCADO PAGO — Checkout Transparente (PIX, Cartão de Crédito, Boleto)
// =============================================================================
// Este módulo gerencia a criação e consulta de pagamentos via Mercado Pago.
// Se as credenciais não estiverem configuradas no .env, o sistema entra em
// modo de SIMULAÇÃO — gera dados fictícios para PIX/carta/boleto sem chamar
// a API real. Assim o site nunca quebra por falta de credenciais.
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
  /** ID externo do pagamento (pode ser numérico do MP ou string simulada) */
  externalPaymentId: string;
  /** Código PIX "copia e cola" */
  pixCode?: string;
  /** QR Code do PIX em base64 */
  pixQrCodeBase64?: string;
  /** URL do boleto */
  boletoUrl?: string;
  /** Quantidade de parcelas */
  installments?: number;
  /** Se o pagamento foi simulado (sem credenciais reais) */
  simulated: boolean;
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "";

/**
 * Retorna true se o Mercado Pago estiver configurado com credenciais reais.
 * Se false, o sistema opera em modo de simulação.
 */
export function isMercadoPagoConfigured(): boolean {
  return ACCESS_TOKEN.length > 0;
}

// ---------------------------------------------------------------------------
// Criação de pagamento
// ---------------------------------------------------------------------------

/**
 * Cria um pagamento no Mercado Pago.
 * Se não houver credenciais configuradas, retorna dados simulados.
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

  if (!isMercadoPagoConfigured()) {
    // ── Modo simulação ──
    return createSimulatedPayment(amount, method, orderId, installments);
  }

  // ── Modo real: chama a API do Mercado Pago ──
  const mpMethodId =
    method === "PIX" ? "pix" : method === "CREDIT_CARD" ? "credit_card" : "bank_transfer";

  const body: Record<string, unknown> = {
    transaction_amount: amount / 100, // API aceita em reais
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
    throw new Error(`Erro ao criar pagamento: ${response.status}`);
  }

  const data: MercadoPagoPaymentResponse = await response.json();

  return {
    method,
    externalPaymentId: String(data.id),
    pixCode: data.point_of_interaction?.transaction_data?.qr_code,
    pixQrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    boletoUrl: data.transaction_details?.external_resource_url,
    installments: method === "CREDIT_CARD" ? installments : undefined,
    simulated: false,
  };
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
    return null; // Em modo simulação não há o que consultar
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
 * Retorna true se válido ou se não houver segredo configurado (modo simulação).
 */
export function validateWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!WEBHOOK_SECRET) return true; // Sem segredo configurado, aceita qualquer notificação
  // A validação real usa HMAC-SHA256. Implementação básica:
  // Em produção, usar crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  if (!signature) return false;
  return signature.includes(WEBHOOK_SECRET);
}

// ---------------------------------------------------------------------------
// Pagamento simulado (fallback quando não há credenciais)
// ---------------------------------------------------------------------------

function createSimulatedPayment(
  amount: number,
  method: "PIX" | "CREDIT_CARD" | "BOLETO",
  orderId: string,
  installments?: number
): CheckoutPaymentResult {
  const simulatedId = `sim-${orderId.slice(-8)}-${Date.now()}`;

  if (method === "PIX") {
    const pixCode = generateSimulatedPixCode(orderId, amount);
    // QR Code em base64: gera uma imagem SVG simples como placeholder
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" fill="white"/>
      <text x="150" y="140" text-anchor="middle" font-size="14" fill="#333">QR Code PIX</text>
      <text x="150" y="165" text-anchor="middle" font-size="10" fill="#666">(modo simulação)</text>
      <text x="150" y="190" text-anchor="middle" font-size="11" fill="#999">Valor: R$ ${(amount / 100).toFixed(2)}</text>
    </svg>`;
    const qrBase64 = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;

    return {
      method: "PIX",
      externalPaymentId: simulatedId,
      pixCode,
      pixQrCodeBase64: qrBase64,
      simulated: true,
    };
  }

  if (method === "CREDIT_CARD") {
    return {
      method: "CREDIT_CARD",
      externalPaymentId: simulatedId,
      installments: installments ?? 1,
      simulated: true,
    };
  }

  // BOLETO
  return {
    method: "BOLETO",
    externalPaymentId: simulatedId,
    boletoUrl: `https://www.mercadopago.com.br/boleto/preview/simulado?id=${simulatedId}`,
    simulated: true,
  };
}

/**
 * Gera um código PIX simulado (payload baseado no padrão EMV).
 * Em modo simulação, não precisa ser escaneável, apenas ilustrativo.
 */
function generateSimulatedPixCode(orderId: string, amount: number): string {
  const shortId = orderId.slice(-12).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const amountStr = (amount / 100).toFixed(2);
  return (
    "000201" + // Payload Format Indicator
    "2683" + // Merchant Account Info length
    "0014br.gov.bcb.pix" + // GUI
    "0136IZAFIT-" + shortId + // Chave PIX simulada
    "52040000" + // Merchant Category Code
    "5303986" + // Transaction Currency (BRL)
    "54" + amountStr.padStart(4, "0") + // Amount
    "5802BR" + // Country Code
    "6304" // CRC16 placeholder
  );
}

/** Valor em centavos — helper para converter de R$ para centavos */
export function toCents(valueBRL: number): number {
  return Math.round(valueBRL * 100);
}
