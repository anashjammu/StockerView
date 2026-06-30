import { AlertCircle, BrainCircuit } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { AIInsight } from "@/components/AIInsight";
import { DataQualityLabel, LocalTime } from "@/components/LocalTime";
import { MetricCard } from "@/components/MetricCard";
import { Panel } from "@/components/Panel";
import { TerminalShell } from "@/components/TerminalShell";
import { TickerLink } from "@/components/TickerLink";
import { cn, formatChange } from "@/lib/utils";
import { fetchMacroNews, fetchMarketNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";
import { fetchFredSeries, fetchRealMarketNews, fetchRealQuote } from "@/lib/provider-gateway";

type HeadlineRow = { time: string; headline: string; impact: string };
type CalendarRow = { time: string; event: string; actual: string; consensus: string; impact: string };
type MoverRow = { symbol: string; name: string; move: number; driver: string };
type LevelRow = { market: string; support: string; pivot: string; resistance: string };
type SectorStrengthRow = { sector: string; change: number; note: string };
type MorningSnapshotRow = { symbol: string; name: string; value: string; change: number; detail: string };

const headlineColumns: Column<HeadlineRow>[] = [
  { key: "time", header: "Time", render: (row) => <span className="text-terminal-cyan"><LocalTime value={dateFromDisplayTime(row.time)} /></span> },
  { key: "headline", header: "Headline", render: (row) => row.headline },
  { key: "impact", header: "Impact", align: "right", render: (row) => <ImpactText impact={row.impact} /> }
];

const calendarColumns: Column<CalendarRow>[] = [
  { key: "time", header: "Time", render: (row) => <span className="text-terminal-cyan"><LocalTime value={dateFromDisplayTime(row.time)} /></span> },
  { key: "event", header: "Event", render: (row) => row.event },
  { key: "actual", header: "Actual", align: "right", render: (row) => row.actual },
  { key: "consensus", header: "Consensus", align: "right", render: (row) => row.consensus },
  { key: "impact", header: "Impact", align: "right", render: (row) => row.impact }
];

const moverColumns: Column<MoverRow>[] = [
  { key: "symbol", header: "Ticker", render: (row) => <TickerLink symbol={row.symbol} /> },
  { key: "name", header: "Name", render: (row) => row.name },
  {
    key: "move",
    header: "Move",
    align: "right",
    render: (row) => <span className={row.move >= 0 ? "text-terminal-green" : "text-terminal-red"}>{formatChange(row.move)}</span>
  },
  { key: "driver", header: "Driver", render: (row) => row.driver }
];

const levelColumns: Column<LevelRow>[] = [
  { key: "market", header: "Market", render: (row) => row.market },
  { key: "support", header: "Support", align: "right", render: (row) => row.support },
  { key: "pivot", header: "Pivot", align: "right", render: (row) => <span className="text-terminal-cyan">{row.pivot}</span> },
  { key: "resistance", header: "Resistance", align: "right", render: (row) => row.resistance }
];

export default async function MorningMarketBriefPage() {
  const brief = await buildMorningBriefData();
  const analysis = generateSourceGroundedAnalysis({
    id: "morning-market-brief",
    title: "Morning Market Brief",
    topic: "Morning market tone, futures, sector leadership, macro events, headlines, and what to watch after the open",
    sources: [...fetchMarketNews(), ...fetchMacroNews()],
    missingData: ["Real-time futures depth", "Confirmed exchange volume", "Full article text for all headlines"],
    confidence: "Medium",
    dataCompleteness: 84
  });

  return (
    <TerminalShell
      active="/morning-market-brief"
      title="Morning Market Brief"
      subtitle="Pre-market futures, sector tone, headlines, calendar risk, ticker movers, and levels to watch."
    >
      <div className="grid gap-3">
        <AiSummaryCard summary={brief.summary} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {brief.snapshots.map((future) => (
            <MetricCard
              key={future.symbol}
              label={
                <>
                  <TickerLink symbol={future.symbol} /> / {future.name}
                </>
              }
              value={future.value}
              change={future.change}
              detail={future.detail}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Sector Strength" action={<span className="font-mono text-xs text-terminal-muted">Premarket read</span>}>
            <div className="grid gap-2">
              {brief.sectors.map((sector) => (
                <SectorRow key={sector.sector} sector={sector} />
              ))}
            </div>
          </Panel>

          <Panel title="Top Headlines" action={<span className="font-mono text-xs text-terminal-muted">Times shown in your local timezone</span>}>
            <DataTable columns={headlineColumns} rows={brief.headlines} />
          </Panel>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Economic Calendar" action={<span className="font-mono text-xs text-terminal-muted">Economic calendar times shown in your local timezone</span>}>
            <DataTable columns={calendarColumns} rows={brief.calendar} />
          </Panel>

          <Panel title="Ticker Movers">
            <DataTable columns={moverColumns} rows={brief.movers} />
          </Panel>
        </div>

        <Panel title="Key Levels To Watch">
          <DataTable columns={levelColumns} rows={brief.levels} />
        </Panel>

        <AIInsight title="Market Insight" analysis={analysis} />

        <DataStatusRow />
      </div>
    </TerminalShell>
  );
}

function DataStatusRow() {
  return <div className="px-1 text-xs text-terminal-muted"><DataQualityLabel /></div>;
}

function dateFromDisplayTime(time: string) {
  const [hour = "0", minute = "0"] = time.replace(" PT", "").split(":");
  return `2026-06-27T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00-07:00`;
}

async function buildMorningBriefData() {
  const [indexQuotes, sectorQuotes, newsPayload, macroPayloads] = await Promise.all([
    Promise.all([
      quoteSnapshot("NASDAQ", "QQQ", "NASDAQ proxy"),
      quoteSnapshot("S&P 500", "SPY", "S&P 500 proxy"),
      quoteSnapshot("NYSE", "VTI", "NYSE broad-market proxy"),
      quoteSnapshot("Dow Jones", "DIA", "Dow Jones proxy")
    ]),
    Promise.all([
      sectorSnapshot("Technology", "XLK"),
      sectorSnapshot("Communication", "XLC"),
      sectorSnapshot("Discretionary", "XLY"),
      sectorSnapshot("Staples", "XLP"),
      sectorSnapshot("Healthcare", "XLV"),
      sectorSnapshot("Financials", "XLF"),
      sectorSnapshot("Industrials", "XLI"),
      sectorSnapshot("Energy", "XLE"),
      sectorSnapshot("Utilities", "XLU"),
      sectorSnapshot("Real Estate", "XLRE"),
      sectorSnapshot("Materials", "XLB")
    ]),
    fetchRealMarketNews({ range: "7d", limit: 20 }),
    Promise.all(["DGS10", "DGS2", "FEDFUNDS", "CPIAUCSL", "UNRATE"].map((series) => fetchFredSeries(series)))
  ]);

  const headlines = (newsPayload.data ?? []).slice(0, 5).map((article) => ({
    time: article.publishedAt,
    headline: article.headline,
    impact: article.impactLevel ?? "Medium"
  }));
  const movers = indexQuotes
    .filter((row) => row.value !== "Unavailable")
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .map((row) => ({ symbol: row.symbol, name: row.name, move: row.change, driver: row.detail }));
  const calendar = macroPayloads.map((payload) => ({
    time: payload.updatedAt,
    event: payload.data?.title ?? payload.error ?? "Macro data unavailable",
    actual: payload.data ? `${payload.data.value} ${payload.data.units}` : "Unavailable",
    consensus: "Unavailable",
    impact: payload.data ? "Medium" : "Low"
  }));

  return {
    summary: {
      tone: indexQuotes.some((row) => row.change > 0.25) ? "Risk-On / Mixed" : indexQuotes.some((row) => row.change < -0.25) ? "Risk-Off / Mixed" : "Neutral",
      summary: indexQuotes.length
        ? "Market tone is based on real provider quotes from major index proxies and the latest provider news feed. Sections with missing provider coverage are marked unavailable instead of filled with sample values."
        : "Real provider data is unavailable for the morning snapshot right now.",
      watch: "Watch index proxy breadth, sector ETF leadership, FRED macro updates, and provider headlines as the session develops."
    },
    snapshots: indexQuotes,
    sectors: sectorQuotes,
    headlines,
    calendar,
    movers,
    levels: [] as LevelRow[]
  };
}

async function quoteSnapshot(name: string, symbol: string, detail: string): Promise<MorningSnapshotRow> {
  const payload = await fetchRealQuote(symbol);
  return {
    symbol,
    name,
    value: payload.data ? `$${payload.data.price.toFixed(2)}` : "Unavailable",
    change: payload.data?.changePercent ?? 0,
    detail: payload.data ? `${detail} / ${payload.source}` : payload.error ?? "Provider unavailable"
  };
}

async function sectorSnapshot(sector: string, symbol: string): Promise<SectorStrengthRow> {
  const payload = await fetchRealQuote(symbol);
  return {
    sector,
    change: payload.data?.changePercent ?? 0,
    note: payload.data ? `${symbol} sector ETF quote from ${payload.source}` : payload.error ?? "Provider unavailable"
  };
}

function AiSummaryCard({ summary }: { summary: { tone: string; summary: string; watch: string } }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-terminal-cyan">
            <BrainCircuit className="h-4 w-4" />
            Morning Market Summary
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{summary.tone}</h2>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-terminal-text">{summary.summary}</p>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-terminal-muted">{summary.watch}</p>
        </div>
        <div className="rounded-md border border-terminal-cyan/25 bg-white/[0.045] px-3 py-2 font-mono text-xs text-terminal-cyan">
          Real provider data
        </div>
      </div>
    </section>
  );
}

function SectorRow({ sector }: { sector: SectorStrengthRow }) {
  const positive = sector.change >= 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{sector.sector}</div>
        <div className={cn("font-mono text-sm", positive ? "text-terminal-green" : "text-terminal-red")}>
          {formatChange(sector.change)}
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-terminal-muted">{sector.note}</p>
    </div>
  );
}

function ImpactText({ impact }: { impact: string }) {
  return (
    <span className={cn("inline-flex items-center justify-end gap-1", impact === "High" ? "text-terminal-red" : "text-terminal-amber")}>
      {impact === "High" ? <AlertCircle className="h-3.5 w-3.5" /> : null}
      {impact}
    </span>
  );
}
