export type ChartTimeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1D" | "5D" | "1Mo" | "3Mo" | "6Mo" | "YTD" | "1Y" | "5Y";

export type OhlcvCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const chartTimeframes: ChartTimeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "5D", "1Mo", "3Mo", "6Mo", "YTD", "1Y", "5Y"];

export function buildEmptyCandleSet() {
  return {
    "1D": [],
    "5D": [],
    "1Mo": [],
    "3Mo": [],
    "6Mo": [],
    YTD: [],
    "1Y": [],
    "5Y": [],
    "1m": [],
    "5m": [],
    "15m": [],
    "30m": [],
    "1h": [],
    "4h": []
  } satisfies Record<ChartTimeframe, OhlcvCandle[]>;
}
