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
    <section className="rounded-md border border-white/[0.08] bg-white/[0.06]">
      <div className="flex flex-col gap-2 border-b border-white/[0.08] px-3 py-2.5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-terminal-cyan">{title}</div>
          <div className="mt-1 text-xs text-terminal-muted">Provider data required / Updated {localTime}</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start rounded-md border border-white/10 bg-white/[0.045] px-3 py-1.5 font-mono text-xs text-terminal-muted transition hover:border-white/20 hover:text-terminal-text md:self-auto"
        >
          {expanded ? "Collapse insight" : "Expand insight"}
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm leading-6 text-terminal-text">{analysis.plainEnglishSummary}</p>
        <p className="mt-2 text-sm leading-6 text-terminal-muted">{analysis.whyItMatters}</p>

        {expanded ? (
          <div className="mt-3 grid gap-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <InsightList title="Key drivers" items={analysis.keyCatalysts} />
              <InsightList title="Main risks" items={analysis.keyRisks} />
            </div>
            <CitationList sources={analysis.sources} />
            <div className="rounded-md border border-terminal-amber/20 bg-white/[0.045] p-3 text-xs leading-5 text-terminal-amber">
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
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="font-mono text-xs uppercase tracking-[0.12em] text-terminal-muted">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-terminal-text">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CitationList({ sources }: { sources: AIAnalysis["sources"] }) {
  if (!sources.length) {
    return <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-xs text-terminal-muted">Sources unavailable</div>;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="font-mono text-xs uppercase tracking-[0.12em] text-terminal-muted">Sources</div>
      <div className="mt-2 grid gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/10 bg-white/[0.04] p-2 text-xs leading-5 text-terminal-muted transition hover:border-terminal-cyan/35 hover:text-terminal-text"
          >
            <span className="font-mono text-terminal-cyan">{source.sourceName}</span>
            <span className="mx-2 text-terminal-muted">/</span>
            {source.title}
          </a>
        ))}
      </div>
    </div>
  );
}
