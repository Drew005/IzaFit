import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";

export default function MetricCard({
  label,
  value,
  delta,
  suffix,
}: {
  label: string;
  value: string;
  delta: number;
  suffix?: string;
}) {
  const positive = delta >= 0;
  return (
    <div className="rounded-md border border-base-line bg-base-raised p-5">
      <p className="text-xs text-ink-soft">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-2xl text-ink">
          {value}
          {suffix && <span className="text-sm text-ink-soft ml-1">{suffix}</span>}
        </p>
        <span
          className={clsx(
            "flex items-center gap-0.5 text-xs font-medium",
            positive ? "text-volt" : "text-alert"
          )}
        >
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}
