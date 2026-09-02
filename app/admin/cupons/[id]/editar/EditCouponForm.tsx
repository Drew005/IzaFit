"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Trash2, AlertTriangle } from "lucide-react";
import { updateCoupon, deleteCoupon } from "@/lib/actions";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: any;
  minPurchase: any;
  maxUses: number | null;
  usedCount: number;
  validUntil: Date | null;
  active: boolean;
}

export default function EditCouponForm({ coupon }: { coupon: Coupon }) {
  const [type, setType] = useState<string>(coupon.type);
  const [active, setActive] = useState<boolean>(coupon.active);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateCouponWithId = updateCoupon.bind(null, coupon.id);

  const defaultDate = coupon.validUntil
    ? new Date(coupon.validUntil).toISOString().split("T")[0]
    : "";

  async function handleDelete() {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await deleteCoupon(coupon.id);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir cupom.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        action={updateCouponWithId}
        onSubmit={() => setLoading(true)}
        className="space-y-6"
      >
        <div className="rounded-md border border-base-line bg-base-raised p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <Tag size={16} className="text-volt" />
              <span>Configuração do Cupom</span>
            </div>

            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="hidden"
                name="active"
                value={active ? "true" : "false"}
              />
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-base-line bg-base text-volt focus:ring-0"
              />
              <span>Cupom Ativo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Código do Cupom *
              </label>
              <input
                type="text"
                name="code"
                required
                defaultValue={coupon.code}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink uppercase font-mono focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Tipo de Desconto *
              </label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              >
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                {type === "PERCENTAGE" ? "Valor em % *" : "Valor em R$ *"}
              </label>
              <input
                type="number"
                name="value"
                step="0.01"
                min="0.01"
                required
                defaultValue={Number(coupon.value)}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Valor Mínimo da Compra (R$)
              </label>
              <input
                type="number"
                name="minPurchase"
                step="0.01"
                min="0"
                defaultValue={coupon.minPurchase ? Number(coupon.minPurchase) : ""}
                placeholder="0.00 (Opcional)"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Limite Máximo de Usos
              </label>
              <input
                type="number"
                name="maxUses"
                min="1"
                defaultValue={coupon.maxUses ?? ""}
                placeholder="Ilimitado se vazio"
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
              <span className="text-[11px] text-ink-soft mt-1 block">
                Já utilizado <strong>{coupon.usedCount}</strong> vezes
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">
                Data de Validade
              </label>
              <input
                type="date"
                name="validUntil"
                defaultValue={defaultDate}
                className="w-full rounded-sm border border-base-line bg-base px-3 py-2 text-sm text-ink focus:border-volt focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/cupons"
            className="flex items-center gap-2 rounded-sm border border-base-line bg-base-raised px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para cupons
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-sm bg-volt text-base px-6 py-2.5 text-sm font-medium hover:bg-volt-dim disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando alterações..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Exclusão */}
      <div className="rounded-md border border-alert/30 bg-alert/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-alert flex items-center gap-2">
            <AlertTriangle size={16} />
            Excluir cupom
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Esta ação excluirá permanentemente o cupom do sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-alert/40 text-alert text-xs font-medium hover:bg-alert hover:text-base transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
        </button>
      </div>
    </div>
  );
}
