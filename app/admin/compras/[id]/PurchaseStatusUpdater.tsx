"use client";

import { useState } from "react";
import { PurchaseStatus } from "@prisma/client";
import { updatePurchaseStatus } from "@/lib/actions";
import { CheckCircle2, Clock, XCircle, PackageCheck } from "lucide-react";

export default function PurchaseStatusUpdater({
  purchaseId,
  currentStatus,
}: {
  purchaseId: string;
  currentStatus: PurchaseStatus;
}) {
  const [status, setStatus] = useState<PurchaseStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: PurchaseStatus) {
    if (newStatus === status) return;
    if (
      newStatus === PurchaseStatus.RECEIVED &&
      !window.confirm(
        "Confirma o recebimento desta compra? As quantidades serão adicionadas automaticamente ao estoque dos respectivos produtos."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await updatePurchaseStatus(purchaseId, newStatus);
      setStatus(newStatus);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-base-line bg-base-raised p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink flex items-center gap-2">
          <PackageCheck size={16} className="text-volt" />
          Gerenciar Recebimento da Mercadoria
        </h3>
        {loading && (
          <span className="text-xs text-volt animate-pulse">Atualizando estoque...</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {status === PurchaseStatus.PENDING && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleStatusChange(PurchaseStatus.RECEIVED)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-volt text-base text-xs font-semibold hover:bg-volt-dim disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 size={16} />
            Marcar como Recebido (Entrada no Estoque)
          </button>
        )}

        {status === PurchaseStatus.RECEIVED && (
          <div className="flex items-center gap-2 text-xs text-volt bg-volt/10 border border-volt/20 px-3 py-2 rounded-sm">
            <CheckCircle2 size={15} />
            Mercadoria recebida e adicionada ao estoque.
          </div>
        )}

        {status !== PurchaseStatus.CANCELED && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleStatusChange(PurchaseStatus.CANCELED)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-base-line bg-base text-xs text-ink-soft hover:text-alert hover:border-alert/50 disabled:opacity-50 transition-colors"
          >
            <XCircle size={14} />
            Cancelar Pedido
          </button>
        )}
      </div>
    </div>
  );
}
