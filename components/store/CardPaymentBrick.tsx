"use client";

import { useEffect, useRef, useState } from "react";

type CardPaymentBrickProps = {
  amount: number; // valor total em centavos
  orderId: string;
  /** Chave pública do Mercado Pago — recebida do servidor (é pública por design). */
  publicKey: string;
  onProcessed: (result: {
    ok: boolean;
    message?: string;
  }) => void;
  onError: (message: string) => void;
};

type MercadoPagoWindow = Window & {
  MercadoPago?: new (publicKey: string) => {
    bricks: () => {
      create: (
        type: "cardPayment",
        container: string,
        settings: Record<string, unknown>
      ) => Promise<{ unmount: () => void }>;
    };
  };
};

/**
 * Renderiza o Card Payment Brick do Mercado Pago (tokenização segura do cartão).
 * Quando o cliente submete o cartão, o Brick gera um token único e o fluxo
 * é enviado ao backend via /api/orders/process.
 *
 * Se a PUBLIC_KEY não estiver configurada, não chama o SDK e informa o pai
 * que o cartão não está disponível.
 */
export default function CardPaymentBrick({
  amount,
  orderId,
  publicKey,
  onProcessed,
  onError,
}: CardPaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ unmount: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    // Sem chave pública ou sem SDK → não dá para tokenizar o cartão.
    if (!publicKey || typeof window === "undefined") {
      setLoading(false);
      setUnavailable(true);
      return;
    }

    let cancelled = false;

    // Carrega o script do SDK do Mercado Pago se ainda não estiver presente.
    const loadSdk = (): Promise<
      NonNullable<MercadoPagoWindow["MercadoPago"]>
    > => {
      const w = window as MercadoPagoWindow;
      if (w.MercadoPago) return Promise.resolve(w.MercadoPago);
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(
          'script[src="https://sdk.mercadopago.com/js/v2"]'
        );
        const script =
          (existing as HTMLScriptElement) ?? document.createElement("script");
        if (!existing) {
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          document.head.appendChild(script);
        }
        script.onload = () => {
          const MP = (window as MercadoPagoWindow).MercadoPago;
          if (MP) resolve(MP);
          else reject(new Error("SDK carregado sem definir MercadoPago"));
        };
        script.onerror = () => reject(new Error("Falha ao carregar SDK"));
      });
    };

    loadSdk()
      .then(async (MercadoPago) => {
        if (cancelled || !containerRef.current) return;
        const mp = new MercadoPago(publicKey);

        const settings = {
          initialization: { amount: amount / 100 },
          callbacks: {
            onReady: () => {
              if (!cancelled) setLoading(false);
            },
            onSubmit: async (
              formData: {
                token: string;
                payment_method_id: string;
                payment_method_type?: string;
                installments: number;
                payer: {
                  email: string;
                  identification?: { type?: string; number?: string };
                };
              },
              _additionalData: unknown
            ) => {
              // Token pronto → envia ao backend para criar a order.
              try {
                const res = await fetch("/api/orders/process", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId,
                    cardToken: formData.token,
                    paymentMethodId: formData.payment_method_id,
                    paymentTypeId:
                      formData.payment_method_type ?? "credit_card",
                    installments: formData.installments,
                  }),
                });
                const data = await res.json();
                if (!res.ok) {
                  onError(data.error || "Erro ao processar o pagamento.");
                } else {
                  onProcessed(data);
                }
              } catch {
                onError("Erro de conexão ao processar o pagamento.");
              }
            },
            onError: (error: unknown) => {
              console.error("[MercadoPago] Brick error:", error);
              onError("Erro no formulário do cartão. Verifique os dados.");
            },
          },
        };

        controllerRef.current = await mp
          .bricks()
          .create("cardPayment", "cardPaymentBrick_container", settings);
      })
      .catch((err) => {
        console.error("[MercadoPago] Falha ao iniciar Brick:", err);
        if (!cancelled) {
          setLoading(false);
          setUnavailable(true);
        }
      });

    return () => {
      cancelled = true;
      controllerRef.current?.unmount?.();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, orderId, publicKey]);

  if (!publicKey) {
    return (
      <div className="rounded-sm border border-base-line bg-base p-4 text-sm text-ink-soft">
        Pagamento com cartão em modo de demonstração (chave pública não
        configurada). Nenhum valor será cobrado.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {loading && (
        <p className="mb-2 text-xs text-ink-soft">
          Carregando formulário seguro do cartão…
        </p>
      )}
      {unavailable ? (
        <div className="rounded-sm border border-base-line bg-base p-4 text-sm text-ink-soft">
          Não foi possível carregar o pagamento por cartão agora. Tente PIX ou
          boleto.
        </div>
      ) : (
        <div id="cardPaymentBrick_container" ref={containerRef} />
      )}
    </div>
  );
}
