"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { searchSymbols } from "@/lib/ticker-service";

export function LiveMarketSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => {
    const base = searchSymbols(query);
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
    <section className="rounded-xl border border-terminal-line bg-terminal-panel p-4">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-terminal-cyan" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value.toUpperCase())}
          placeholder="Search any stock, ETF, index, or future..."
          aria-label="Ticker lookup"
          className="h-10 w-full rounded-lg border border-terminal-line bg-terminal-panel pl-10 pr-3 text-sm text-terminal-text outline-none transition placeholder:text-terminal-muted focus:border-terminal-cyan/70"
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item.symbol}
            type="button"
            onClick={() => submitSymbol(item.symbol)}
            className="inline-flex items-center gap-2 rounded-full border border-terminal-line bg-terminal-panel2 px-2.5 py-1 text-left text-xs transition hover:border-terminal-cyan/35 hover:text-terminal-cyan"
          >
            <span className="font-mono font-semibold">{item.symbol}</span>
            <span className="text-terminal-muted">{item.name}</span>
            <span className="rounded-full border border-terminal-line bg-terminal-panel px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-terminal-cyan">
              {formatAssetType(item.assetType)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-terminal-muted">Examples: NVDA, MU, AMD, PLTR, QQQ, SPY, ES, NQ, CL, GC, ZN</p>
    </section>
  );
}

function formatAssetType(assetType: string) {
  if (assetType === "stock") return "Stock";
  if (assetType === "future") return "Future";
  return assetType;
}
