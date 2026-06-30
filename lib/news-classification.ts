export const NEWS_TIMEZONE = "America/Los_Angeles";

export const newsCategories = [
  "AI",
  "Earnings",
  "Semiconductors",
  "Macro",
  "Fed",
  "Yields",
  "Stocks",
  "Futures",
  "Energy",
  "Metals",
  "Crypto",
  "Bonds",
  "Analyst Ratings",
  "Geopolitics",
  "Finance",
  "Market"
] as const;

export type NewsPrimaryCategory = (typeof newsCategories)[number];
export type LocalDateBucket = "today" | "yesterday" | "last7d" | "older";

const categoryRules: Array<{ category: NewsPrimaryCategory; weight: number; keywords: string[] }> = [
  { category: "Earnings", weight: 11, keywords: ["earnings", "revenue", "eps", "guidance", "quarterly results", "q1", "q2", "q3", "q4", "profit", "sales", "beat", "miss", "report", "results"] },
  { category: "AI", weight: 10, keywords: ["ai", "artificial intelligence", "generative ai", "data center", "gpu", "chips", "nvidia", "openai", "machine learning", "cloud ai"] },
  { category: "Semiconductors", weight: 9, keywords: ["semiconductor", "chip", "gpu", "memory", "dram", "hbm", "wafer", "foundry", "tsmc", "nvidia", "amd", "broadcom", "micron", "arm", "intel"] },
  { category: "Fed", weight: 8, keywords: ["federal reserve", "fed", "powell", "fomc", "rate cut", "rate hike", "interest rates", "monetary policy"] },
  { category: "Macro", weight: 7, keywords: ["economy", "gdp", "cpi", "pce", "inflation", "unemployment", "jobs", "payrolls", "consumer spending", "recession", "economic growth"] },
  { category: "Yields", weight: 7, keywords: ["treasury yield", "bond yield", "10-year", "2-year", "yields", "rates market"] },
  { category: "Futures", weight: 6, keywords: ["futures", "es", "nq", "ym", "rty", "index futures", "premarket futures"] },
  { category: "Analyst Ratings", weight: 6, keywords: ["upgrade", "downgrade", "price target", "analyst", "rating", "initiated", "overweight", "neutral", "buy rating", "sell rating"] },
  { category: "Energy", weight: 5, keywords: ["oil", "crude", "wti", "brent", "natural gas", "opec", "energy stocks"] },
  { category: "Metals", weight: 5, keywords: ["gold", "silver", "copper", "precious metals"] },
  { category: "Crypto", weight: 5, keywords: ["bitcoin", "ethereum", "crypto", "cryptocurrency", "btc", "eth"] },
  { category: "Bonds", weight: 5, keywords: ["bond market", "treasuries", "fixed income", "corporate bonds", "credit spreads"] },
  { category: "Geopolitics", weight: 5, keywords: ["war", "conflict", "iran", "china", "tariffs", "sanctions", "trade tensions", "geopolitical"] },
  { category: "Finance", weight: 5, keywords: ["bank", "banks", "insurance", "reinsurance", "lending", "credit", "financials", "roe", "underwriting", "premiums", "claims", "asset manager", "profitability"] },
  { category: "Stocks", weight: 4, keywords: ["stock market", "wall street", "s&p 500", "nasdaq", "dow", "equities", "shares", "rally", "selloff"] }
];

export function classifyNewsArticle(input: { title?: string; headline?: string; snippet?: string; category?: string; relatedTickers?: string[]; sourceName?: string }) {
  const text = `${input.title ?? ""} ${input.headline ?? ""} ${input.snippet ?? ""} ${input.category ?? ""} ${(input.relatedTickers ?? []).join(" ")} ${input.sourceName ?? ""}`.toLowerCase();
  const matches = categoryRules
    .map((rule) => ({
      category: rule.category,
      score: rule.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? rule.weight : 0), 0)
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
  const categories = matches.map((match) => match.category);

  if (!categories.length) categories.push("Market");

  return {
    primaryCategory: categories[0],
    categories
  };
}

export function getLocalDateBucket(publishedAt: string, timezone = NEWS_TIMEZONE): LocalDateBucket {
  const articleDay = localDayKey(new Date(publishedAt), timezone);
  const today = localDayKey(new Date(), timezone);
  const yesterday = localDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000), timezone);
  const daysAgo = differenceInLocalDays(articleDay, today);

  if (articleDay === today) return "today";
  if (articleDay === yesterday) return "yesterday";
  if (daysAgo >= 0 && daysAgo <= 6) return "last7d";
  return "older";
}

export function getRangeStart(range: string | undefined, timezone = NEWS_TIMEZONE) {
  const normalized = (range ?? "7d").toLowerCase();
  if (normalized === "today" || normalized === "1d") return startOfLocalDay(new Date(), timezone);
  const days = normalized === "3d" ? 3 : normalized === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function formatLocalArticleTime(value: string, timezone = NEWS_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

function startOfLocalDay(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const offset = timezoneOffsetMs(utcGuess, timezone);
  return new Date(utcGuess.getTime() - offset);
}

function localDayKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function differenceInLocalDays(fromDay: string, toDay: string) {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const asUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
  return asUtc - date.getTime();
}
