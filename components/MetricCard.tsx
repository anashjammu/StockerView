import { cn, formatChange } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  change,
  detail,
  selected,
  onClick
}: {
  label: React.ReactNode;
  value: string;
  change?: number;
  detail?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const positive = (change ?? 0) >= 0;
  const className = cn(
    "min-w-0 rounded-xl border border-white/[0.10] bg-white/[0.06] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:border-terminal-cyan/35 hover:bg-white/[0.085]",
    selected && "border-terminal-cyan/50 bg-terminal-cyan/[0.10]"
  );
  const content = (
    <>
      <div className="truncate text-xs font-medium text-terminal-muted">{label}</div>
      <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0 truncate text-2xl font-semibold tracking-tight">{value}</div>
        {typeof change === "number" ? (
          <div className={cn("text-sm", positive ? "text-terminal-green" : "text-terminal-red")}>
            {formatChange(change)}
          </div>
        ) : null}
      </div>
      {detail ? <div className="mt-2 text-xs text-terminal-muted">{detail}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={selected} className={cn(className, "text-left")}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}
