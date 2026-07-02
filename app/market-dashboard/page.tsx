"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, HeatMap } from "@/components/Charts";
import { InteractivePriceChart } from "@/components/InteractivePriceChart";
import { LiveMarketSearch } from "@/components/LiveMarketSearch";
import { Panel } from "@/components/Panel";
import { SortableDataTable, type SortableColumn } from "@/components/SortableDataTable";
import { TerminalShell } from "@/components/TerminalShell";
import { TickerLink } from "@/components/TickerLink";
import { buildEmptyCandleSet, type ChartTimeframe, type OhlcvCandle } from "@/lib/chart-data";
import { cn, formatChange } from "@/lib/utils";
import { heatMap, indexChartTitles, marketBreadth, type Ticker } from "@/lib/app-data";

type MarketIndexTicker = Ticker & {
  displaySymbol: string;
  providerSymbol: string;
};

const marketIndexes = [
  { displayName: "NASDAQ", displaySymbol: "NASDAQ", providerSymbols: ["IXIC", "^IXIC", "NASDAQ"] },
  { displayName: "S&P 500", displaySymbol: "SPX", providerSymbols: ["GSPC", "^GSPC", "SPX"] },
  { displayName: "NYSE", displaySymbol: "NYSE", providerSymbols: ["NYA", "^NYA", "NYSE"] },
  { displayName: "Dow Jones", displaySymbol: "DJI", providerSymbols: ["DJI", "^DJI", "DJIA"] }
];

const columns: SortableColumn<MarketIndexTicker>[] = [
  { key: "symbol", header: "Ticker", render: (row) => <TickerLink symbol={row.symbol} />, sortValue: (row) => row.symbol },
  { key: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },
  { key: "price", header: "Last", align: "right", render: (row) => row.price.toFixed(2), sortValue: (row) => row.price },
  {
    key: "change",
    header: "Chg %",
    align: "right",
    render: (row) => (
      <span className={row.change >= 0 ? "text-terminal-green" : "text-terminal-red"}>
        {formatChange(row.change)}
      </span>
    ),
    sortValue: (row) => row.change
  },
  {
    key: "volume",
    header: "Volume",
    align: "right",
    render: (row) => row.volume,
    sortValue: (row) => Number(String(row.volume).replace(/,/g, "")) || 0
  },
  { key: "sector", header: "Sector", render: (row) => row.sector, sortValue: (row) => row.sector }
];

export default function MarketDashboard() {
  const [selectedIndex, setSelectedIndex] = useState("NASDAQ");
  const [quotes, setQuotes] = useState<MarketIndexTicker[]>([]);
  const [chartCandles, setChartCandles] = useState<Record<ChartTimeframe, OhlcvCandle[]>>(buildEmptyCandleSet());
  const selectedIndexData = quotes.find((index) => index.symbol === selectedIndex);
  const selectedProviderSymbol = selectedIndexData?.providerSymbol ?? "IXIC";

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
      title="StockerView"
      subtitle="Simple market research for stocks, ETFs, and market news."
    >
      <div className="grid gap-5">
        <LiveMarketSearch
          prominent
          assetTypes={["stock", "ETF"]}
          placeholder="Search a stock or ETF..."
          examples="Examples: NVDA, AMD, Apple, Microsoft, SPY, QQQ"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quotes.map((index) => (
            <IndexCard
              key={index.symbol}
              index={index}
              selected={selectedIndex === index.symbol}
              onSelect={() => setSelectedIndex(index.symbol)}
            />
          ))}
          {!quotes.length ? (
            <div className="rounded-2xl border border-terminal-line bg-terminal-panel p-5 text-sm text-terminal-muted md:col-span-2 xl:col-span-4">
              Market index data is unavailable from configured providers right now.
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
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

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Market Summary">
            <div className="space-y-3 text-sm leading-6 text-terminal-muted">
              <p>
                Use the search bar to look up a stock or ETF, then review price action, key stats, setup signals, and related news.
              </p>
              <p>
                Index cards give a quick read on broad market direction. Select an index to update the chart.
              </p>
            </div>
          </Panel>

          <Panel title="Sector Heat Map">
            <HeatMap items={heatMap} />
          </Panel>
        </div>

        <Panel title="Equity Monitor">
          <SortableDataTable columns={columns} rows={quotes} defaultSortKey="price" />
        </Panel>
      </div>
    </TerminalShell>
  );
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
        "min-w-0 rounded-2xl border border-terminal-line bg-terminal-panel p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-terminal-cyan/25 hover:bg-terminal-panel2/50",
        selected && "border-terminal-cyan/35 bg-terminal-cyan/[0.07]"
      )}
    >
      <div className="truncate text-xs text-terminal-muted">
        <TickerLink symbol={index.symbol} /> · {index.name}
      </div>
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
        sector: "Index"
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
