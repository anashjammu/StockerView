import { Panel } from "@/components/Panel";
import { TerminalShell } from "@/components/TerminalShell";

export default function TickerLoading() {
  return (
    <TerminalShell active="" title="Ticker Research Terminal" subtitle="Preparing ticker detail view.">
      <Panel title="Loading">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 font-mono text-sm text-terminal-muted">
          Loading ticker data...
        </div>
      </Panel>
    </TerminalShell>
  );
}
