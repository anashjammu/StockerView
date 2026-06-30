"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchSymbols } from "@/lib/ticker-service";

export function LiveMarketSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => searchSymbols(query).slice(0, 10), [query]);

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
    <section className="rounded-2xl border border-terminal-cyan/20 bg-terminal-cyan/[0.08] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-terminal-cyan" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value.toUpperCase())}
          placeholder="Search any stock, ETF, index, or future..."
          aria-label="Ticker lookup"
          className="h-14 w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 font-mono text-base text-terminal-text outline-none transition placeholder:text-terminal-muted focus:border-terminal-cyan/70 focus:bg-black/25"
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item.symbol}
            type="button"
            onClick={() => submitSymbol(item.symbol)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-left text-xs transition hover:border-terminal-cyan/40 hover:text-terminal-cyan"
          >
            <span className="font-mono font-semibold">{item.symbol}</span>
            <span className="text-terminal-muted">{item.name}</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-terminal-cyan">
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
