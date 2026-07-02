"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { searchSymbols, type AssetType } from "@/lib/ticker-service";
import { cn } from "@/lib/utils";

export function LiveMarketSearch({
  placeholder = "Search any stock, ETF, index, or future...",
  examples = "Examples: NVDA, MU, AMD, PLTR, QQQ, SPY, ES, NQ, CL, GC, ZN",
  assetTypes,
  className,
  prominent = false
}: {
  placeholder?: string;
  examples?: string;
  assetTypes?: AssetType[];
  className?: string;
  prominent?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => {
    const base = searchSymbols(query).filter((item) => !assetTypes?.length || assetTypes.includes(item.assetType));
    if (!query.trim()) return base.slice(0, 10);

    return matchSorter(base, query, {
      keys: ["symbol", "name", "assetType"],
      threshold: matchSorter.rankings.CONTAINS
    }).slice(0, 10);
  }, [query]);

  function submitSymbol(symbol: string) {
    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      return;
    }

    router.push(`/ticker/${encodeURIComponent(normalized)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSymbol(query);
  }

  return (
    <section className={cn("rounded-2xl border border-terminal-line bg-terminal-panel p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]", prominent && "p-5 md:p-6", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className={cn("pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-terminal-cyan", prominent ? "h-5 w-5" : "h-4 w-4")} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value.toUpperCase())}
          placeholder={placeholder}
          aria-label="Ticker lookup"
          className={cn(
            "w-full rounded-xl border border-terminal-line bg-terminal-panel pl-11 pr-4 text-terminal-text outline-none transition placeholder:text-terminal-muted focus:border-terminal-cyan/70 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
            prominent ? "h-14 text-base" : "h-10 text-sm"
          )}
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item.symbol}
            type="button"
            onClick={() => submitSymbol(item.symbol)}
            className="inline-flex items-center gap-2 rounded-full border border-terminal-line bg-terminal-panel2 px-3 py-1.5 text-left text-xs transition hover:border-terminal-cyan/35 hover:text-terminal-cyan"
          >
            <span className="font-mono font-semibold">{item.symbol}</span>
            <span className="text-terminal-muted">{item.name}</span>
            <span className="rounded-full border border-terminal-line bg-terminal-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-terminal-cyan">
              {formatAssetType(item.assetType)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-terminal-muted">{examples}</p>
    </section>
  );
}

function formatAssetType(assetType: string) {
  if (assetType === "stock") return "Stock";
  if (assetType === "future") return "Future";
  return assetType;
}
