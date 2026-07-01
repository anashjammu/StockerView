"use client";

import { useEffect, useState } from "react";
import type { AIAnalysis } from "@/lib/research-engine";
import { formatDateTimeInUserTimeZone } from "@/lib/timezone";

const compactDisclaimer =
  "For research and educational purposes only. Not financial advice. Data may be delayed, incomplete, or inaccurate.";

export function AIInsight({ title = "AI Insight", analysis }: { title?: string; analysis: AIAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [localTime, setLocalTime] = useState("--:-- Local");

  useEffect(() => {
    setLocalTime(formatDateTimeInUserTimeZone(analysis.generatedAt));
  }, [analysis.generatedAt]);

  return (
    <section className="rounded-2xl border border-terminal-line bg-terminal-panel">
      <div className="flex flex-col gap-2 border-b border-terminal-line px-5 py-3.5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-terminal-text">{title}</div>
          <div className="mt-1 text-xs text-terminal-muted">Updated {localTime}</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start rounded-lg border border-terminal-line bg-terminal-panel2 px-3 py-1.5 text-xs text-terminal-muted transition hover:border-terminal-cyan/30 hover:text-terminal-text md:self-auto"
        >
          {expanded ? "Collapse insight" : "Expand insight"}
        </button>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm leading-6 text-terminal-text">{analysis.plainEnglishSummary}</p>
        <p className="mt-2 text-sm leading-6 text-terminal-muted">{analysis.whyItMatters}</p>

        {expanded ? (
          <div className="mt-3 grid gap-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <InsightList title="Key drivers" items={analysis.keyCatalysts} />
              <InsightList title="Main risks" items={analysis.keyRisks} />
            </div>
            <CitationList sources={analysis.sources} />
            <div className="rounded-lg border border-terminal-amber/20 bg-terminal-panel2 p-3 text-xs leading-5 text-terminal-amber">
              {compactDisclaimer}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-terminal-line bg-terminal-panel2 p-3">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-terminal-muted">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-terminal-line bg-terminal-panel px-2.5 py-1 text-xs text-terminal-text">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CitationList({ sources }: { sources: AIAnalysis["sources"] }) {
  if (!sources.length) {
    return <div className="rounded-xl border border-terminal-line bg-terminal-panel2 p-3 text-xs text-terminal-muted">Sources unavailable</div>;
  }

  return (
    <div className="rounded-xl border border-terminal-line bg-terminal-panel2 p-3">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-terminal-muted">Sources</div>
      <div className="mt-2 grid gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-terminal-line bg-terminal-panel p-2 text-xs leading-5 text-terminal-muted transition hover:border-terminal-cyan/30 hover:text-terminal-text"
          >
            <span className="font-medium text-terminal-cyan">{source.sourceName}</span>
            <span className="mx-2 text-terminal-muted">/</span>
            {source.title}
          </a>
        ))}
      </div>
    </div>
  );
}
