import Link from "next/link";
import { cn } from "@/lib/utils";

export function TickerLink({
  symbol,
  className,
  onClick
}: {
  symbol: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const normalized = symbol.trim().toUpperCase();

  if (!normalized || normalized === "CASH") {
    return <span className={className}>{symbol}</span>;
  }

  return (
    <Link
      href={`/ticker/${encodeURIComponent(normalized)}`}
      onClick={onClick}
      className={cn(
        "font-mono font-semibold tracking-[0.01em] text-terminal-cyan underline-offset-4 transition hover:text-terminal-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan/50",
        className
      )}
    >
      {normalized}
    </Link>
  );
}
