export type SetupLabel = "Strong setup" | "Constructive setup" | "Mixed setup" | "Weak setup" | "Poor setup" | "Limited data";
export type SignalStatus = "available" | "unavailable";

export type SetupSignalScore = {
  label: "Trend" | "Momentum" | "Volume" | "Valuation" | "Growth" | "News" | "Risk";
  status: SignalStatus;
  score: number | null;
  detail: string;
};

type SetupTechnical = {
  label: string;
  value: string;
  signal?: string;
};

type SetupFundamental = {
  metric: string;
  value: string;
};

type SetupNews = {
  headline?: string;
  title?: string;
};

type SetupCandle = {
  time: string;
  close: number;
  volume?: number;
};

export type OpportunityScoreInput = {
  symbol: string;
  price?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  technicals?: SetupTechnical[];
  fundamentals?: SetupFundamental[];
  news?: SetupNews[];
  candles?: SetupCandle[];
};

export type OpportunityScoreResult = {
  score: number | null;
  label: SetupLabel;
  verdict: SetupLabel;
  dataCoverage: {
    available: number;
    total: number;
    label: string;
  };
  availableSignals: string[];
  unavailableSignals: string[];
  signalScores: SetupSignalScore[];
  drivers: string[];
  risks: string[];
  recoveryCatalysts: string[];
  whyDown: string[];
  catalystWatch: string[];
  isUnavailable: boolean;
  unavailableReason?: string;
};

const signalTotal = 7;

export function calculateOpportunityScore(tickerData: OpportunityScoreInput): OpportunityScoreResult {
  const signals = [
    scoreTrend(tickerData),
    scoreMomentum(tickerData),
    scoreVolume(tickerData),
    scoreValuation(tickerData),
    scoreGrowth(tickerData),
    scoreNews(tickerData),
    scoreRisk(tickerData)
  ];
  const availableSignals = signals.filter((signal) => signal.status === "available" && signal.score !== null);
  const unavailableSignals = signals.filter((signal) => signal.status === "unavailable");
  const availableLabels = availableSignals.map((signal) => signal.label);
  const unavailableLabels = unavailableSignals.map((signal) => signal.label);
  const coverage = {
    available: availableSignals.length,
    total: signalTotal,
    label: `${availableSignals.length}/${signalTotal} signals`
  };

  if (availableSignals.length < 3) {
    return {
      score: null,
      label: "Limited data",
      verdict: "Limited data",
      dataCoverage: coverage,
      availableSignals: availableLabels,
      unavailableSignals: unavailableLabels,
      signalScores: signals,
      drivers: ["Not enough real data available for this signal."],
      whyDown: ["Not enough real data available for this signal."],
      recoveryCatalysts: ["Not enough real data available for this signal."],
      risks: buildUnavailableRisks(unavailableLabels),
      catalystWatch: ["Ticker-specific news and provider fundamentals can improve this setup review when available."],
      isUnavailable: true,
      unavailableReason: "Not enough real provider data is available to produce a reliable setup analysis."
    };
  }

  const score = Math.round(availableSignals.reduce((total, signal) => total + (signal.score ?? 0), 0) / availableSignals.length);
  const label = setupLabel(score);

  return {
    score,
    label,
    verdict: label,
    dataCoverage: coverage,
    availableSignals: availableLabels,
    unavailableSignals: unavailableLabels,
    signalScores: signals,
    drivers: buildDrivers(signals),
    whyDown: buildWhyDown(signals),
    recoveryCatalysts: buildRecoveryCatalysts(signals),
    risks: buildRisks(signals),
    catalystWatch: buildCatalystWatch(tickerData),
    isUnavailable: false
  };
}

function scoreTrend(data: OpportunityScoreInput): SetupSignalScore {
  const price = positiveNumber(data.price);
  const ma20 = technicalNumber(data.technicals, "20D MA");
  const ma50 = technicalNumber(data.technicals, "50D MA");
  const ma200 = technicalNumber(data.technicals, "200D MA");
  const availableMas = [ma20, ma50, ma200].filter((value): value is number => value !== null);

  if (!price || !availableMas.length) return unavailable("Trend", "Moving-average trend data unavailable.");

  const aboveCount = availableMas.filter((ma) => price > ma).length;
  const score = Math.round((aboveCount / availableMas.length) * 100);
  const details = [
    ma20 ? `20D ${price > ma20 ? "above" : "below"}` : null,
    ma50 ? `50D ${price > ma50 ? "above" : "below"}` : null,
    ma200 ? `200D ${price > ma200 ? "above" : "below"}` : null
  ].filter(Boolean);

  return available("Trend", score, `Price is ${details.join(", ")} available moving averages.`);
}

function scoreMomentum(data: OpportunityScoreInput): SetupSignalScore {
  const rsi = technicalNumber(data.technicals, "RSI");
  const closes = validCloses(data.candles);
  const perf1m = performance(closes, 22);
  const perf3m = performance(closes, 66);
  const values: number[] = [];
  const detail: string[] = [];

  if (rsi !== null) {
    values.push(rsi >= 45 && rsi <= 65 ? 70 : rsi > 65 && rsi <= 75 ? 60 : rsi < 35 ? 35 : rsi > 75 ? 40 : 50);
    detail.push(`RSI is ${rsi.toFixed(1)}`);
  }
  if (perf1m !== null) {
    values.push(scorePerformance(perf1m));
    detail.push(`1M performance is ${formatPercent(perf1m)}`);
  }
  if (perf3m !== null) {
    values.push(scorePerformance(perf3m));
    detail.push(`3M performance is ${formatPercent(perf3m)}`);
  }

  if (!values.length) return unavailable("Momentum", "RSI and recent performance data unavailable.");
  return available("Momentum", averageScore(values), detail.join("; ") + ".");
}

function scoreVolume(data: OpportunityScoreInput): SetupSignalScore {
  const relativeVolume = technicalRelativeVolume(data.technicals);
  if (relativeVolume === null) return unavailable("Volume", "Relative volume data unavailable.");
  const score = relativeVolume >= 1.2 ? 75 : relativeVolume >= 0.8 ? 62 : 42;
  return available("Volume", score, `Relative volume is ${relativeVolume.toFixed(2)}x average.`);
}

function scoreValuation(data: OpportunityScoreInput): SetupSignalScore {
  const pe = fundamentalNumber(data.fundamentals, "P/E");
  const priceSales = fundamentalNumber(data.fundamentals, "Price/Sales");
  const priceBook = fundamentalNumber(data.fundamentals, "Price/Book");
  const values = [pe, priceSales, priceBook].filter((value): value is number => value !== null);

  if (!values.length) return unavailable("Valuation", "Valuation ratios unavailable from provider fundamentals.");

  const scores = [
    pe === null ? null : pe > 0 && pe <= 20 ? 75 : pe <= 35 ? 62 : pe <= 60 ? 48 : 35,
    priceSales === null ? null : priceSales <= 3 ? 72 : priceSales <= 8 ? 58 : 42,
    priceBook === null ? null : priceBook <= 4 ? 68 : priceBook <= 10 ? 54 : 40
  ].filter((value): value is number => value !== null);

  return available("Valuation", averageScore(scores), `Provider valuation data available for ${values.length} ratio${values.length === 1 ? "" : "s"}.`);
}

function scoreGrowth(data: OpportunityScoreInput): SetupSignalScore {
  return unavailable("Growth", "Revenue growth, EPS growth, and margin trend data unavailable from current provider response.");
}

function scoreNews(data: OpportunityScoreInput): SetupSignalScore {
  const newsCount = data.news?.length ?? 0;
  if (!newsCount) return unavailable("News", "Ticker-specific news unavailable.");
  const score = newsCount >= 5 ? 72 : newsCount >= 2 ? 62 : 52;
  return available("News", score, `Ticker-specific news flow is active with ${newsCount} recent article${newsCount === 1 ? "" : "s"}.`);
}

function scoreRisk(data: OpportunityScoreInput): SetupSignalScore {
  const closes = validCloses(data.candles);
  const volatility = realizedVolatility(closes);
  const dayHigh = positiveNumber(data.dayHigh);
  const dayLow = positiveNumber(data.dayLow);
  const price = positiveNumber(data.price);
  const values: number[] = [];
  const detail: string[] = [];

  if (volatility !== null) {
    values.push(volatility < 25 ? 72 : volatility < 45 ? 58 : 42);
    detail.push(`realized volatility is ${volatility.toFixed(1)}%`);
  }

  if (price && dayHigh && dayLow && dayHigh > dayLow) {
    const rangePosition = ((price - dayLow) / (dayHigh - dayLow)) * 100;
    values.push(rangePosition >= 45 ? 65 : 45);
    detail.push(`price is ${rangePosition.toFixed(0)}% through the provider day range`);
  }

  if (!values.length) return unavailable("Risk", "Volatility, 52-week range, and debt/equity data unavailable.");
  return available("Risk", averageScore(values), detail.join("; ") + ".");
}

function buildDrivers(signals: SetupSignalScore[]) {
  const items = signals
    .filter((signal) => signal.status === "available" && (signal.score ?? 0) >= 60)
    .map((signal) => signal.detail);
  return items.length ? items.slice(0, 5) : ["No strong positive setup signals are available from real provider data."];
}

function buildWhyDown(signals: SetupSignalScore[]) {
  const items = signals
    .filter((signal) => signal.status === "available" && (signal.score ?? 100) < 50)
    .map((signal) => signal.detail);
  return items.length ? items.slice(0, 4) : ["No clear downside setup signal is available from current real provider data."];
}

function buildRecoveryCatalysts(signals: SetupSignalScore[]) {
  const unavailable = signals.filter((signal) => signal.status === "unavailable").map((signal) => signal.label);
  const items = [
    "Price reclaiming or holding key moving averages.",
    signals.some((signal) => signal.label === "News" && signal.status === "available") ? "Sustained positive company-specific news flow." : null,
    unavailable.includes("Growth") || unavailable.includes("Valuation") ? "Real earnings, valuation, and growth updates from providers." : null
  ].filter(Boolean) as string[];
  return items.length ? items : ["Not enough real data available for this signal."];
}

function buildRisks(signals: SetupSignalScore[]) {
  const risks = signals
    .filter((signal) => signal.status === "available" && (signal.score ?? 100) < 55)
    .map((signal) => signal.detail);
  const unavailable = signals.filter((signal) => signal.status === "unavailable").map((signal) => signal.label);
  if (unavailable.length) risks.push(`${unavailable.join(", ")} data unavailable, so setup confidence is limited.`);
  return risks.length ? risks.slice(0, 4) : ["Current real provider data does not show a major setup risk signal."];
}

function buildUnavailableRisks(unavailableSignals: string[]) {
  return unavailableSignals.length
    ? [`${unavailableSignals.join(", ")} data unavailable, so setup confidence is limited.`]
    : ["Not enough real data available for this signal."];
}

function buildCatalystWatch(data: OpportunityScoreInput) {
  return [
    data.news?.length ? "Company-specific news flow." : null,
    data.technicals?.length ? "Trend changes around moving averages and RSI." : null,
    data.fundamentals?.length ? "Provider fundamentals and valuation updates." : null
  ].filter(Boolean) as string[];
}

function setupLabel(score: number): SetupLabel {
  if (score >= 80) return "Strong setup";
  if (score >= 65) return "Constructive setup";
  if (score >= 50) return "Mixed setup";
  if (score >= 35) return "Weak setup";
  return "Poor setup";
}

function available(label: SetupSignalScore["label"], score: number, detail: string): SetupSignalScore {
  return { label, status: "available", score: Math.max(0, Math.min(100, Math.round(score))), detail };
}

function unavailable(label: SetupSignalScore["label"], detail: string): SetupSignalScore {
  return { label, status: "unavailable", score: null, detail };
}

function technicalNumber(technicals: SetupTechnical[] | undefined, labelIncludes: string) {
  const item = technicals?.find((technical) => technical.label.toLowerCase().includes(labelIncludes.toLowerCase()));
  return parseNumber(item?.value);
}

function technicalRelativeVolume(technicals: SetupTechnical[] | undefined) {
  const item = technicals?.find((technical) => technical.label.toLowerCase().includes("volume"));
  return parseNumber(item?.value);
}

function fundamentalNumber(fundamentals: SetupFundamental[] | undefined, metric: string) {
  const item = fundamentals?.find((fundamental) => fundamental.metric === metric);
  return parseNumber(item?.value);
}

function parseNumber(value: string | undefined) {
  if (!value || value === "Unavailable") return null;
  const match = value.replace(/[$,%]/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function validCloses(candles: SetupCandle[] | undefined) {
  return (candles ?? []).map((candle) => candle.close).filter((close) => Number.isFinite(close) && close > 0);
}

function performance(closes: number[], lookback: number) {
  if (closes.length <= lookback) return null;
  const latest = closes.at(-1);
  const previous = closes.at(-lookback);
  if (!latest || !previous) return null;
  return ((latest - previous) / previous) * 100;
}

function scorePerformance(value: number) {
  if (value >= 15) return 78;
  if (value >= 5) return 68;
  if (value >= -5) return 55;
  if (value >= -15) return 42;
  return 30;
}

function realizedVolatility(closes: number[]) {
  if (closes.length < 22) return null;
  const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index]));
  const mean = returns.reduce((total, value) => total + value, 0) / returns.length;
  const variance = returns.reduce((total, value) => total + (value - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function averageScore(values: number[]) {
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
