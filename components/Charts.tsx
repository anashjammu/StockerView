import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/app-data";

function scalePoints(points: PricePoint[], width: number, height: number, padding = 14) {
  if (!points.length) {
    return [];
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (point.value - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });
}

export function LineChart({
  points,
  color = "#7dd3fc",
  height = 220
}: {
  points: PricePoint[];
  color?: string;
  height?: number;
}) {
  const width = 640;
  const scaled = scalePoints(points, width, height);
  if (!scaled.length) {
    return <ChartUnavailable message="Chart data unavailable from real provider." />;
  }

  const path = scaled.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${scaled[scaled.length - 1].x} ${height - 12} L ${scaled[0].x} ${height - 12} Z`;

  return (
    <div className="h-full min-h-[180px] min-w-0 overflow-hidden w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-full w-full min-w-0">
        <defs>
          <linearGradient id="line-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((tick) => (
          <line
            key={tick}
            x1="12"
            x2={width - 12}
            y1={height * tick}
            y2={height * tick}
            stroke="rgba(148, 163, 184, 0.12)"
          />
        ))}
        <path d={area} fill="url(#line-area)" />
        <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        {scaled.map((point, index) =>
          index % 3 === 0 || index === scaled.length - 1 ? (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="2.5" fill="#10161d" stroke={color} strokeWidth="1.5" />
              <text x={point.x} y={height - 2} textAnchor="middle" fill="#94a3b8" fontSize="11">
                {point.label}
              </text>
            </g>
          ) : null
        )}
      </svg>
    </div>
  );
}

export function BarChart({
  points,
  color = "#7dd3fc",
  suffix = ""
}: {
  points: PricePoint[];
  color?: string;
  suffix?: string;
}) {
  if (!points.length) {
    return <ChartUnavailable message="Data unavailable from provider." />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="min-w-0 space-y-3">
      {points.map((point) => (
        <div key={point.label} className="grid grid-cols-[52px_1fr_54px] items-center gap-3 text-xs">
          <div className="text-terminal-muted">{point.label}</div>
          <div className="h-2 overflow-hidden rounded-full bg-black/20">
            <div className="h-full rounded-full" style={{ width: `${(point.value / max) * 100}%`, background: color }} />
          </div>
          <div className="text-right text-terminal-text">
            {point.value}
            {suffix}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeatMap({ items }: { items: { sector: string; change: number }[] }) {
  if (!items.length) {
    return <ChartUnavailable message="Sector data unavailable from provider." />;
  }

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-4">
      {items.map((item) => {
        const positive = item.change >= 0;

        return (
          <div
            key={item.sector}
            className="min-h-24 rounded-md border border-white/[0.08] bg-white/[0.045] p-3"
          >
            <div className="text-sm font-medium">{item.sector}</div>
            <div className={cn("mt-4 font-mono text-xl", positive ? "text-terminal-green" : "text-terminal-red")}>
              {positive ? "+" : ""}
              {item.change.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  if (!items.length) {
    return <ChartUnavailable message="Portfolio market data unavailable from provider." />;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;

  return (
    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 42 42" className="h-36 w-36 rotate-[-90deg]">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        {items.map((item) => {
          const dash = (item.value / total) * 100;
          const circle = (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={item.color}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
              strokeWidth="7"
            />
          );
          offset -= dash;
          return circle;
        })}
      </svg>
      <div className="flex-1 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 font-mono text-sm">
            <span className="flex items-center gap-2 text-terminal-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
              {item.label}
            </span>
            <span>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartUnavailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded border border-dashed border-white/10 px-4 text-center text-sm text-terminal-muted">
      {message}
    </div>
  );
}
