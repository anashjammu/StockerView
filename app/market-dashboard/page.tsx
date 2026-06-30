"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, HeatMap } from "@/components/Charts";
import { DataTable, type Column } from "@/components/DataTable";
import { AIInsight } from "@/components/AIInsight";
import { DataQualityLabel } from "@/components/LocalTime";
import { InteractivePriceChart } from "@/components/InteractivePriceChart";
import { Panel } from "@/components/Panel";
import { TerminalShell } from "@/components/TerminalShell";
import { TickerLink } from "@/components/TickerLink";
import { buildEmptyCandleSet, type ChartTimeframe, type OhlcvCandle } from "@/lib/chart-data";
import { cn, formatChange } from "@/lib/utils";
import { fetchMacroNews, fetchMarketNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";
import { heatMap, indexChartTitles, marketBreadth, type Ticker } from "@/lib/app-data";

type MarketIndexTicker = Ticker & {
  displaySymbol: string;
  providerSymbol: string;
  proxyLabel?: string;
};

const marketIndexes = [
  { displayName: "NASDAQ", displaySymbol: "NASDAQ", providerSymbols: ["^IXIC", "QQQ"], proxySymbol: "QQQ" },
  { displayName: "S&P 500", displaySymbol: "SPX", providerSymbols: ["^GSPC", "SPY"], proxySymbol: "SPY" },
  { displayName: "NYSE", displaySymbol: "NYSE", providerSymbols: ["^NYA", "VTI"], proxySymbol: "VTI" },
  { displayName: "Dow Jones", displaySymbol: "DJI", providerSymbols: ["^DJI", "DIA"], proxySymbol: "DIA" }
];

const columns: Column<MarketIndexTicker>[] = [
  { key: "symbol", header: "Ticker", render: (row) => <TickerLink symbol={row.symbol} /> },
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "price", header: "Last", align: "right", render: (row) => row.price.toFixed(2) },
  {
    key: "change",
    header: "Chg %",
    align: "right",
    render: (row) => (
      <span className={row.change >= 0 ? "text-terminal-green" : "text-terminal-red"}>
        {formatChange(row.change)}
      </span>
    )
  },
  { key: "volume", header: "Volume", align: "right", render: (row) => row.volume },
  { key: "sector", header: "Sector", render: (row) => row.sector }
];

export default function MarketDashboard() {
  const [selectedIndex, setSelectedIndex] = useState("NASDAQ");
  const [quotes, setQuotes] = useState<MarketIndexTicker[]>([]);
  const [chartCandles, setChartCandles] = useState<Record<ChartTimeframe, OhlcvCandle[]>>(buildEmptyCandleSet());
  const selectedIndexData = quotes.find((index) => index.symbol === selectedIndex);
  const selectedProviderSymbol = selectedIndexData?.providerSymbol ?? "QQQ";
  const analysis = generateSourceGroundedAnalysis({
    id: "market-dashboard",
    title: "Market Drivers",
    topic: "Index direction, sector leadership, weak groups, macro drivers, and market-news context",
    sources: [...fetchMarketNews(), ...fetchMacroNews()],
    missingData: ["Real-time market breadth", "Full index constituent attribution", "Live volume by exchange"],
    confidence: "Medium",
    dataCompleteness: 80
  });

  useEffect(() => {
    let active = true;

    Promise.all(
      marketIndexes.map(resolveMarketIndexQuote)
    ).then((rows) => {
      if (active) setQuotes(rows.filter(Boolean) as MarketIndexTicker[]);
    }).catch(() => {
      if (active) setQuotes([]);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`/api/history/${encodeURIComponent(selectedProviderSymbol)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setChartCandles(buildChartSet(payload.data?.candles ?? []));
      })
      .catch(() => {
        if (active) setChartCandles(buildEmptyCandleSet());
      });

    return () => {
      active = false;
    };
  }, [selectedProviderSymbol]);

  return (
    <TerminalShell
      active="/market-dashboard"
      title="Market Dashboard"
      subtitle="Global index pulse, market breadth, sector heat, and live-style equity monitor."
    >
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quotes.map((index) => (
            <IndexCard
              key={index.symbol}
              index={index}
              selected={selectedIndex === index.symbol}
              onSelect={() => setSelectedIndex(index.symbol)}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
          <InteractivePriceChart
            title={indexChartTitles[selectedIndex] ?? selectedIndexData?.name ?? selectedIndex}
            symbol={selectedProviderSymbol}
            candlesByTimeframe={chartCandles}
            currentPrice={selectedIndexData?.price}
          />
          <Panel title="Market Breadth">
            <BarChart points={marketBreadth.map((item) => ({ label: item.label, value: item.value }))} color="#66f2a5" />
          </Panel>
        </div>

        <Panel title="Sector Heat Map">
          <HeatMap items={heatMap} />
        </Panel>

        <Panel title="Equity Monitor">
          <DataTable columns={columns} rows={quotes} />
        </Panel>

        <AIInsight title="Why Markets Are Moving" analysis={analysis} />

        <DataStatusRow />
      </div>
    </TerminalShell>
  );
}

function DataStatusRow() {
  return <div className="px-1 text-xs text-terminal-muted"><DataQualityLabel /></div>;
}

function IndexCard({
  index,
  selected,
  onSelect
}: {
  index: MarketIndexTicker;
  selected: boolean;
  onSelect: () => void;
}) {
  const positive = index.change >= 0;

  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-white/[0.08] bg-white/[0.06] p-3 transition hover:border-white/15 hover:bg-white/[0.085]",
        selected && "border-white/20 bg-terminal-cyan/[0.10]"
      )}
    >
      <div className="truncate text-xs text-terminal-muted">
        <TickerLink symbol={index.symbol} /> · {index.name}
      </div>
      {index.proxyLabel ? <div className="mt-1 truncate font-mono text-[11px] text-terminal-amber">{index.proxyLabel}</div> : null}
      <button type="button" onClick={onSelect} aria-pressed={selected} className="mt-2 flex w-full min-w-0 items-end justify-between gap-3 text-left">
        <span className="min-w-0 truncate text-xl font-semibold tracking-tight">{index.price ? index.price.toFixed(2) : "Data unavailable"}</span>
        <span className={cn("text-sm", positive ? "text-terminal-green" : "text-terminal-red")}>{formatChange(index.change)}</span>
      </button>
    </div>
  );
}

async function resolveMarketIndexQuote(index: (typeof marketIndexes)[number]): Promise<MarketIndexTicker | null> {
  for (const providerSymbol of index.providerSymbols) {
    const response = await fetch(`/api/quote/${encodeURIComponent(providerSymbol)}`);
    const payload = await response.json();
    const quote = payload.data;

    if (quote) {
      return {
        symbol: index.displaySymbol,
        displaySymbol: index.displaySymbol,
        providerSymbol,
        name: index.displayName,
        price: quote.price,
        change: quote.changePercent,
        volume: quote.volume ? quote.volume.toLocaleString() : "Unavailable",
        sector: providerSymbol === index.proxySymbol ? "ETF proxy" : "Index",
        proxyLabel: providerSymbol === index.proxySymbol ? `Using ${providerSymbol} as real-data proxy.` : undefined
      };
    }
  }

  return null;
}

function buildChartSet(candles: OhlcvCandle[]) {
  if (!candles.length) return buildEmptyCandleSet();
  return {
    "1D": candles.slice(-1),
    "5D": candles.slice(-5),
    "1Mo": candles.slice(-22),
    "3Mo": candles.slice(-66),
    "6Mo": candles.slice(-132),
    YTD: candles.filter((candle) => new Date(candle.time).getUTCFullYear() === new Date().getUTCFullYear()),
    "1Y": candles.slice(-252),
    "5Y": candles,
    "1m": candles,
    "5m": candles,
    "15m": candles,
    "30m": candles,
    "1h": candles,
    "4h": candles
  };
}
