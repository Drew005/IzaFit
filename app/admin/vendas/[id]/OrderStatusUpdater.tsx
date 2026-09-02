"use client";

import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/lib/actions";
import { CheckCircle2, Clock, Truck, Check, XCircle } from "lucide-react";

const statuses: { label: string; value: OrderStatus; icon: any }[] = [
  { label: "Pendente", value: OrderStatus.PENDING, icon: Clock },
  { label: "Pago", value: OrderStatus.PAID, icon: CheckCircle2 },
  { label: "Enviado", value: OrderStatus.SHIPPED, icon: Truck },
  { label: "Concluído", value: OrderStatus.COMPLETED, icon: Check },
  { label: "Cancelado", value: OrderStatus.CANCELED, icon: XCircle },
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === status) return;
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus);
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
        <h3 className="text-sm font-medium text-ink">Atualizar Status do Pedido</h3>
        {loading && (
          <span className="text-xs text-volt animate-pulse">Atualizando...</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const Icon = s.icon;
          const isActive = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={loading}
              onClick={() => handleStatusChange(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-volt text-base border-volt"
                  : "bg-base text-ink-soft border-base-line hover:text-ink hover:border-volt/60"
              }`}
            >
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
