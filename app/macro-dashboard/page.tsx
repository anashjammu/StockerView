import { BarChart, LineChart } from "@/components/Charts";
import { DataTable, type Column } from "@/components/DataTable";
import { AIInsight } from "@/components/AIInsight";
import { DataQualityLabel, LocalTime } from "@/components/LocalTime";
import { MetricCard } from "@/components/MetricCard";
import { Panel } from "@/components/Panel";
import { TerminalShell } from "@/components/TerminalShell";
import { economicCalendar, macroTiles, yieldCurve } from "@/lib/app-data";
import { fetchFredSeries } from "@/lib/provider-gateway";
import { formatChange } from "@/lib/utils";
import { fetchMacroNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";

type EventRow = (typeof economicCalendar)[number];

const calendarColumns: Column<EventRow>[] = [
  { key: "time", header: "Time", render: (row) => <span className="text-terminal-cyan"><LocalTime value={dateFromDisplayTime(row.time)} /></span> },
  { key: "event", header: "Event", render: (row) => row.event },
  { key: "actual", header: "Actual", align: "right", render: (row) => row.actual },
  { key: "consensus", header: "Consensus", align: "right", render: (row) => row.consensus },
  { key: "impact", header: "Impact", align: "right", render: (row) => row.impact }
];

export default async function MacroDashboard() {
  const tenYear = await fetchFredSeries("DGS10");
  const displayedMacroTiles = tenYear.data
    ? [{ label: "10Y Treasury", value: `${tenYear.data.value.toFixed(2)}%`, change: 0 }]
    : macroTiles;
  const analysis = generateSourceGroundedAnalysis({
    id: "macro-dashboard",
    title: "Source-Grounded Macro Explanation",
    topic: "Inflation, Fed expectations, Treasury yields, dollar direction, oil, gold, jobs data, and likely market impact",
    sources: fetchMacroNews(),
    missingData: ["Live Fed funds futures", "Full FRED historical series", "Real-time dollar and commodity order flow"],
    confidence: "Medium",
    dataCompleteness: 78
  });

  return (
    <TerminalShell
      active="/macro-dashboard"
      title="Macro Dashboard"
      subtitle="Rates, inflation, commodities, and economic calendar for top-down market context."
    >
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayedMacroTiles.map((tile) => (
            <MetricCard key={tile.label} label={tile.label} value={tile.value} change={tile.change} />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="Treasury Curve">
            <BarChart points={yieldCurve} color="#4de3ff" suffix="%" />
          </Panel>
          <Panel title="Inflation Trend">
            <LineChart points={[]} color="#ff6b86" />
          </Panel>
        </div>

        <Panel
          title="Economic Calendar"
          action={<span className="font-mono text-xs text-terminal-muted">Economic calendar times shown in your local timezone / DXY {formatChange(0.22)}</span>}
        >
          <DataTable columns={calendarColumns} rows={economicCalendar} />
        </Panel>

        <AIInsight title="Macro Insight" analysis={analysis} />

        <DataStatusRow />
      </div>
    </TerminalShell>
  );
}

function DataStatusRow() {
  return <div className="px-1 text-xs text-terminal-muted"><DataQualityLabel source="FRED" status="delayed" delay="End-of-day / release-based" /></div>;
}

function dateFromDisplayTime(time: string) {
  const [hour = "0", minute = "0"] = time.replace(" PT", "").split(":");
  return `2026-06-27T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00-07:00`;
}
