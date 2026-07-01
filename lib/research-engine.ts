export type ConfidenceLevel = "Low" | "Medium" | "High";
export type SourceConfidence = "High" | "Medium" | "Low";

export type NewsSourceItem = {
  id: string;
  title: string;
  sourceName: string;
  author?: string;
  url: string;
  publishedAt: string;
  publishedAtLocal?: string;
  relatedTickers: string[];
  category: string;
  snippet: string;
  fullText?: string;
  sentiment?: string;
  impactLevel?: string;
  sourceConfidence: SourceConfidence;
};

export type AIAnalysis = {
  mode: "Detailed Analysis";
  confidenceLevel: ConfidenceLevel;
  dataCompleteness: number;
  generatedAt: string;
  plainEnglishSummary: string;
  whatHappened: string;
  whyItMatters: string;
  bullCase: string;
  bearCase: string;
  keyCatalysts: string[];
  keyRisks: string[];
  valuationContext: string;
  technicalContext: string;
  newsContext: string;
  macroContext: string;
  missingData: string[];
  sources: NewsSourceItem[];
};

export const researchDisclaimer =
  "AI analysis is generated from the sources and market data listed below. It is for research and education only, not financial advice. Data may be delayed, incomplete, or inaccurate.";

export const footerResearchDisclaimer =
  "StockerView is for research and educational purposes only. Not financial advice. Data may be delayed, incomplete, or inaccurate.";

export const newsSources: NewsSourceItem[] = [];

export function normalizeNewsSources(sources: NewsSourceItem[]) {
  return sources.map((source) => ({
    ...source,
    publishedAtLocal: source.publishedAtLocal ?? source.publishedAt
  }));
}

export function fetchTickerNews(_symbol: string) {
  return [] as NewsSourceItem[];
}

export function fetchMarketNews() {
  return [] as NewsSourceItem[];
}

export function fetchMacroNews() {
  return [] as NewsSourceItem[];
}

export function fetchNewsByCategory(_category: string) {
  return [] as NewsSourceItem[];
}

export function normalizeNewsArticle(rawArticle: Partial<NewsSourceItem>): NewsSourceItem {
  return {
    id: rawArticle.id ?? "unavailable",
    title: rawArticle.title ?? "Data unavailable",
    sourceName: rawArticle.sourceName ?? "Unavailable",
    author: rawArticle.author,
    url: rawArticle.url ?? "#",
    publishedAt: rawArticle.publishedAt ?? new Date().toISOString(),
    publishedAtLocal: rawArticle.publishedAtLocal,
    relatedTickers: rawArticle.relatedTickers ?? [],
    category: rawArticle.category ?? "Uncategorized",
    snippet: rawArticle.snippet ?? "Data unavailable",
    fullText: rawArticle.fullText,
    sentiment: rawArticle.sentiment,
    impactLevel: rawArticle.impactLevel,
    sourceConfidence: rawArticle.sourceConfidence ?? "Low"
  };
}

export function normalizeNewsArticles(rawArticles: Array<Partial<NewsSourceItem>>) {
  return rawArticles.map(normalizeNewsArticle);
}

export function calculateDataCompleteness(fields: Array<unknown>) {
  if (!fields.length) return 0;
  const available = fields.filter((field) => field !== null && field !== undefined && field !== "" && field !== "Data unavailable").length;
  return Math.round((available / fields.length) * 100);
}

export function generateSourceGroundedAnalysis({
  id: _id,
  title: _title,
  topic,
  sources = [],
  missingData = [],
  confidence,
  confidenceLevel = "Low",
  dataCompleteness = 0
}: {
  id?: string;
  title?: string;
  topic: string;
  sources?: NewsSourceItem[];
  missingData?: string[];
  confidence?: ConfidenceLevel;
  confidenceLevel?: ConfidenceLevel;
  dataCompleteness?: number;
}): AIAnalysis {
  const normalizedSources = normalizeNewsSources(sources);
  const missing = missingData.length ? missingData : ["Provider market data", "Provider news sources"];
  const hasQuote = !missing.some((item) => item.toLowerCase().includes("quote"));
  const hasHistory = !missing.some((item) => item.toLowerCase().includes("chart") || item.toLowerCase().includes("history"));
  const hasFundamentals = !missing.some((item) => item.toLowerCase().includes("fundamental") || item.toLowerCase().includes("key stats"));
  const hasEarnings = !missing.some((item) => item.toLowerCase().includes("earnings"));
  const hasPeers = !missing.some((item) => item.toLowerCase().includes("peer"));
  const hasNews = normalizedSources.length > 0;

  const catalysts = [
    hasHistory ? "Recent price and trend context is available from real candles." : "Trend context is limited due to missing real candle history.",
    hasFundamentals ? "Key stats are partially populated from configured providers." : "Fundamental coverage is limited from configured providers.",
    hasEarnings ? "Earnings fields are available from provider reports." : "Earnings fields are unavailable from configured providers."
  ];

  const risks = [
    hasQuote ? "Quote-level context is available but may be delayed by provider." : "Current quote is unavailable from configured providers.",
    hasPeers ? "Peer context is available for relative comparison." : "Peer comparison is unavailable from configured providers.",
    hasNews ? "Recent ticker news is present for context." : "No recent ticker-specific news was available."
  ];

  const summaryFragments = [
    hasQuote ? "Price context is available." : "Price context is missing.",
    hasHistory ? "Chart trend inputs are available." : "Chart trend inputs are missing.",
    hasFundamentals ? "Key stats have partial provider coverage." : "Key stats have limited coverage.",
    hasEarnings ? "Earnings history is available." : "Earnings history is unavailable.",
    hasPeers ? "Peer comparison inputs are available." : "Peer comparison inputs are unavailable.",
    hasNews ? "Recent news context is available." : "Recent news context is unavailable."
  ];

  return {
    mode: "Detailed Analysis",
    confidenceLevel: confidence ?? confidenceLevel,
    dataCompleteness,
    generatedAt: new Date().toISOString(),
    plainEnglishSummary: `${topic}: ${summaryFragments.join(" ")}`,
    whatHappened: hasHistory ? "Recent price-series data is available for trend context." : "Price-series trend context is unavailable from configured providers.",
    whyItMatters: "This insight is rule-based and only reflects available provider data; missing inputs reduce confidence.",
    bullCase: hasFundamentals ? "Some fundamental inputs are populated, supporting deeper research context." : "Fundamental coverage is limited, so upside context is incomplete.",
    bearCase: hasEarnings ? "Earnings and estimate context can be compared where available." : "Without earnings coverage, downside risk context remains incomplete.",
    keyCatalysts: catalysts,
    keyRisks: risks,
    valuationContext: hasFundamentals ? "Valuation metrics are drawn from configured provider fields when present." : "Valuation metrics are unavailable from configured providers.",
    technicalContext: hasHistory ? "Technical context is derived from real candles and trend signals." : "Technical context is unavailable without sufficient candle history.",
    newsContext: hasNews ? "News context is derived from connected ticker news sources." : "News context unavailable from connected sources.",
    macroContext: "Macro context is not inferred unless present in connected ticker/news data.",
    missingData: missing,
    sources: normalizedSources
  };
}
