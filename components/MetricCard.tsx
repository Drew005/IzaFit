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
    <div className="rounded-md border border-base-line bg-base-raised p-4 sm:p-5 flex flex-col justify-between">
      <p className="text-xs text-ink-soft truncate">{label}</p>
      <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
        <p className="font-display text-xl sm:text-2xl text-ink truncate font-medium">
          {value}
          {suffix && <span className="text-xs sm:text-sm text-ink-soft ml-1 font-normal">{suffix}</span>}
        </p>
        <span
          className={clsx(
            "flex shrink-0 items-center gap-0.5 text-[11px] sm:text-xs font-medium",
            positive ? "text-volt" : "text-alert"
          )}
        >
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}
