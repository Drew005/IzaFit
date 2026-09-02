import clsx from "clsx";

const TONES: Record<string, string> = {
  positive: "bg-volt/10 text-volt",
  neutral: "bg-moss/20 text-moss-light",
  warning: "bg-alert/10 text-alert",
  muted: "bg-base text-ink-soft border border-base-line",
};

export default function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}
