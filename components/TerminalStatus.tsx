"use client";

import { useEffect, useState } from "react";
import { formatTimeInUserTimeZone, getShortTimeZoneLabel, getUserTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export function TerminalStatus() {
  const [clock, setClock] = useState("--:--");
  const [timezone, setTimezone] = useState("Local");
  const [latency, setLatency] = useState("--ms");

  useEffect(() => {
    const updateStatus = () => {
      const detectedTimeZone = getUserTimeZone();
      setClock(formatTimeInUserTimeZone(new Date(), detectedTimeZone));
      setTimezone(getShortTimeZoneLabel(new Date(), detectedTimeZone));
      setLatency(`${12 + Math.floor(Math.random() * 8)}ms`);
    };

    updateStatus();
    const intervalId = window.setInterval(updateStatus, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="grid w-full grid-cols-2 gap-2 text-xs md:w-auto md:grid-cols-[82px_70px_132px_82px]">
      <Status label="Latency" value={latency} />
      <Status label="Mode" value="Paper" />
      <Status label="Clock" value={clock} />
      <Status label="Timezone" value={timezone} />
    </div>
  );
}

function Status({
  label,
  value,
  className,
  valueClassName
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-white/[0.10] bg-white/[0.06] px-3 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur", className)}>
      <div className="text-terminal-muted">{label}</div>
      <div className={cn("min-w-0 text-terminal-text", valueClassName)}>{value}</div>
    </div>
  );
}
