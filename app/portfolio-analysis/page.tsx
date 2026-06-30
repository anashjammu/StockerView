"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart, DonutChart } from "@/components/Charts";
import { DataTable, type Column } from "@/components/DataTable";
import { AIInsight } from "@/components/AIInsight";
import { InteractivePriceChart } from "@/components/InteractivePriceChart";
import { DataQualityLabel } from "@/components/LocalTime";
import { MetricCard } from "@/components/MetricCard";
import { Panel } from "@/components/Panel";
import { TerminalShell } from "@/components/TerminalShell";
import { TickerLink } from "@/components/TickerLink";
import { buildEmptyCandleSet } from "@/lib/chart-data";
import { fetchMarketNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";
import { cn } from "@/lib/utils";

type EditableHolding = {
  id: string;
  ticker: string;
  shares: number;
  averageCost: number;
};

type CalculatedHolding = EditableHolding & {
  sector: string;
  price: number;
  positionValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  allocation: number;
  risk: "Low" | "Med" | "High";
};

const STORAGE_KEY = "marketpulse-portfolio";
const colors = ["#4de3ff", "#66f2a5", "#f6bd60", "#ff6b86", "#7dd3fc", "#facc15", "#8fa2b7", "#c084fc"];

const priceBook = buildPriceBook();

const holdingColumns: Column<CalculatedHolding>[] = [
  { key: "ticker", header: "Ticker", render: (row) => <TickerLink symbol={row.ticker} /> },
  { key: "shares", header: "Shares", align: "right", render: (row) => row.shares.toLocaleString() },
  { key: "averageCost", header: "Avg Cost", align: "right", render: (row) => formatCurrency(row.averageCost) },
  { key: "price", header: "Price", align: "right", render: (row) => formatCurrency(row.price) },
  { key: "positionValue", header: "Position Value", align: "right", render: (row) => formatCurrency(row.positionValue) },
  {
    key: "gainLoss",
    header: "Gain/Loss",
    align: "right",
    render: (row) => (
      <span className={row.gainLoss >= 0 ? "text-terminal-green" : "text-terminal-red"}>
        {formatCurrency(row.gainLoss)} / {formatPercent(row.gainLossPercent)}
      </span>
    )
  },
  { key: "allocation", header: "Allocation", align: "right", render: (row) => `${row.allocation.toFixed(1)}%` },
  { key: "sector", header: "Sector", render: (row) => row.sector },
  { key: "risk", header: "Risk", align: "right", render: (row) => <RiskPill risk={row.risk} /> }
];

export default function PortfolioAnalysis() {
  const [holdings, setHoldings] = useState<EditableHolding[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [form, setForm] = useState({ ticker: "", shares: "", averageCost: "" });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { holdings?: EditableHolding[]; cashBalance?: number };
        if (Array.isArray(parsed.holdings)) {
          setHoldings(parsed.holdings);
        }
        if (typeof parsed.cashBalance === "number") {
          setCashBalance(parsed.cashBalance);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ holdings, cashBalance }));
  }, [cashBalance, holdings]);

  const portfolio = useMemo(() => calculatePortfolio(holdings, cashBalance), [cashBalance, holdings]);

  function handleAddHolding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = form.ticker.trim().toUpperCase();
    const shares = Number(form.shares);
    const averageCost = Number(form.averageCost);

    if (!ticker || shares <= 0 || averageCost < 0) {
      return;
    }

    setHoldings((current) => {
      const existing = current.find((holding) => holding.ticker === ticker);

      if (!existing) {
        return [...current, { id: crypto.randomUUID(), ticker, shares, averageCost }];
      }

      return current.map((holding) => (holding.id === existing.id ? { ...holding, shares, averageCost } : holding));
    });
    setForm({ ticker: "", shares: "", averageCost: "" });
  }

  function removeHolding(id: string) {
    setHoldings((current) => current.filter((holding) => holding.id !== id));
  }

  return (
    <TerminalShell
      active="/portfolio-analysis"
      title="Portfolio Analysis"
      subtitle="Editable holdings, allocation, sector exposure, concentration risk, and portfolio risk scoring."
    >
      <div className="grid gap-3">
        <Panel
          title="Manual portfolio"
          action={<span className="font-mono text-xs text-terminal-muted">Saved locally in this browser</span>}
        >
          <form onSubmit={handleAddHolding} className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Field label="Ticker">
              <input
                value={form.ticker}
                onChange={(event) => setForm((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))}
                placeholder="NVDA"
                className="terminal-input"
              />
            </Field>
            <Field label="Shares">
              <input
                value={form.shares}
                onChange={(event) => setForm((current) => ({ ...current, shares: event.target.value }))}
                type="number"
                min="0"
                step="0.0001"
                placeholder="100"
                className="terminal-input"
              />
            </Field>
            <Field label="Average cost">
              <input
                value={form.averageCost}
                onChange={(event) => setForm((current) => ({ ...current, averageCost: event.target.value }))}
                type="number"
                min="0"
                step="0.01"
                placeholder="125.00"
                className="terminal-input"
              />
            </Field>
            <Field label="Cash balance">
              <input
                value={cashBalance}
                onChange={(event) => {
                  setCashBalance(Number(event.target.value));
                }}
                type="number"
                min="0"
                step="0.01"
                className="terminal-input"
              />
            </Field>
            <button
              type="submit"
              className="h-10 self-end rounded-md border border-terminal-cyan/25 bg-white/[0.045] px-4 font-mono text-sm text-terminal-cyan transition hover:border-terminal-cyan/50 hover:text-terminal-text"
            >
              Add
            </button>
          </form>
        </Panel>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Net Liquidation" value={formatCurrency(portfolio.totalValue)} change={portfolio.totalGainLossPercent} />
          <MetricCard label="Gain/Loss" value={formatCurrency(portfolio.totalGainLoss)} detail={`${formatPercent(portfolio.totalGainLossPercent)} weighted return`} />
          <MetricCard label="Concentration Risk" value={portfolio.concentrationRisk} detail={`Largest position ${portfolio.largestAllocation.toFixed(1)}%`} />
          <MetricCard label="Portfolio Risk Score" value={portfolio.riskScore.toString()} detail={`${portfolio.riskLabel} risk`} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <InteractivePriceChart
            title="Portfolio Equity Curve"
            symbol="PORTFOLIO"
            candlesByTimeframe={buildEmptyCandleSet()}
            currentPrice={portfolio.totalValue}
          />
          <Panel title="Allocation">
            <DonutChart items={portfolio.allocationChart} />
          </Panel>
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Sector Exposure">
            <BarChart points={portfolio.sectorExposure} color="#f6bd60" suffix="%" />
          </Panel>
          <Panel title="Holdings" action={<span className="font-mono text-xs text-terminal-muted">{holdings.length} positions</span>}>
            <DataTable columns={holdingColumns} rows={portfolio.calculatedHoldings} />
            <div className="mt-3 grid gap-2">
              {holdings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-xs">
                  <span className="font-mono text-terminal-muted">
                    <TickerLink symbol={holding.ticker} /> / {holding.shares} sh / {formatCurrency(holding.averageCost)} avg
                  </span>
                  <button type="button" onClick={() => removeHolding(holding.id)} className="text-terminal-red transition hover:text-terminal-text">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <AIInsight
          title="Portfolio Insight"
          analysis={generateSourceGroundedAnalysis({
            id: "portfolio-analysis",
            title: "AI Portfolio Review",
            topic: "Allocation risk, concentration risk, sector exposure, factor exposure, single-stock risk, and ETF overlap where data is available",
            sources: fetchMarketNews(),
            missingData: ["Tax lots", "ETF holdings overlap", "Live beta and correlation matrix", "User risk tolerance"],
            confidence: "Medium",
            dataCompleteness: 72
          })}
        />
        <DataStatusRow />
      </div>
    </TerminalShell>
  );
}

function DataStatusRow() {
  return <div className="px-1 text-xs text-terminal-muted"><DataQualityLabel /></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-terminal-muted">{label}</span>
      {children}
    </label>
  );
}

function calculatePortfolio(holdings: EditableHolding[], cashBalance: number) {
  const rawHoldings = holdings.map((holding) => {
    const quote = priceBook[holding.ticker] ?? getSyntheticQuote(holding.ticker);
    const positionValue = holding.shares * quote.price;
    const costBasis = holding.shares * holding.averageCost;
    const gainLoss = positionValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      ...holding,
      sector: quote.sector,
      price: quote.price,
      positionValue,
      costBasis,
      gainLoss,
      gainLossPercent,
      allocation: 0,
      risk: "Low" as CalculatedHolding["risk"]
    };
  });

  const totalPositionValue = rawHoldings.reduce((sum, holding) => sum + holding.positionValue, 0);
  const totalCostBasis = rawHoldings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const totalValue = totalPositionValue + cashBalance;
  const totalGainLoss = rawHoldings.reduce((sum, holding) => sum + holding.gainLoss, 0);
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  const calculatedHoldings = rawHoldings.map((holding) => {
    const allocation = totalValue > 0 ? (holding.positionValue / totalValue) * 100 : 0;
    const risk: CalculatedHolding["risk"] = allocation >= 20 || holding.sector === "Quantum Computing" ? "High" : allocation >= 10 ? "Med" : "Low";

    return {
      ...holding,
      allocation,
      risk
    };
  });

  const largestAllocation = Math.max(0, ...calculatedHoldings.map((holding) => holding.allocation));
  const concentrationRisk = largestAllocation >= 30 ? "High" : largestAllocation >= 20 ? "Elevated" : largestAllocation >= 12 ? "Moderate" : "Low";
  const sectorTotals = calculatedHoldings.reduce<Record<string, number>>((totals, holding) => {
    totals[holding.sector] = (totals[holding.sector] ?? 0) + holding.allocation;
    return totals;
  }, {});
  const largestSector = Math.max(0, ...Object.values(sectorTotals));
  const riskScore = Math.min(100, Math.round(20 + largestAllocation * 1.3 + largestSector * 0.7 + Math.max(0, -totalGainLossPercent) * 1.2));
  const riskLabel = riskScore >= 75 ? "High" : riskScore >= 55 ? "Moderate / High" : riskScore >= 35 ? "Moderate" : "Low";

  const allocationChart = [
    ...calculatedHoldings.map((holding, index) => ({ label: holding.ticker, value: Number(holding.allocation.toFixed(1)), color: colors[index % colors.length] })),
    ...(cashBalance > 0 && totalValue > 0 ? [{ label: "Cash", value: Number(((cashBalance / totalValue) * 100).toFixed(1)), color: "#8fa2b7" }] : [])
  ].filter((item) => item.value > 0);

  const sectorExposure = Object.entries(sectorTotals)
    .map(([label, value]) => ({ label, value: Number(value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);

  return {
    calculatedHoldings,
    totalValue,
    totalGainLoss,
    totalGainLossPercent,
    allocationChart,
    sectorExposure,
    concentrationRisk,
    largestAllocation,
    riskScore,
    riskLabel
  };
}

function buildPriceBook() {
  return {} as Record<string, { price: number; sector: string }>;
}

function getSyntheticQuote(_ticker: string) {
  return {
    price: 0,
    sector: "Data unavailable"
  };
}

function RiskPill({ risk }: { risk: CalculatedHolding["risk"] }) {
  const className =
    risk === "High"
      ? "border-terminal-red/25 text-terminal-red"
      : risk === "Med"
        ? "border-terminal-amber/25 text-terminal-amber"
        : "border-terminal-green/25 text-terminal-green";

  return <span className={cn("inline-flex rounded-md border bg-white/[0.045] px-2.5 py-1 font-mono text-xs", className)}>{risk}</span>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
