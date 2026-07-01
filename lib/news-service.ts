export type NewsCategory =
  | "AI"
  | "Semiconductors"
  | "Memory"
  | "Macro"
  | "Fed"
  | "Yields"
  | "Earnings"
  | "Analyst Ratings"
  | "ETFs"
  | "Crypto"
  | "Geopolitical"
  | "Index Futures"
  | "Energy"
  | "Metals"
  | "Rates";

export type NewsSentiment = "Bullish" | "Neutral" | "Bearish";
export type NewsImpact = "Low" | "Medium" | "High";
export type NewsItemType = "feed" | "article" | "calendar";

export type NewsItem = {
  id: string;
  type: NewsItemType;
  headline: string;
  sourceName: string;
  author?: string;
  url: string;
  publishedAt: string;
  publishedLocalTime?: string;
  localDateBucket?: string;
  primaryCategory?: string;
  categories?: string[];
  relatedTickers: string[];
  category: NewsCategory | string;
  snippet: string;
  sentiment?: NewsSentiment;
  impactLevel?: NewsImpact;
  whyItMatters?: string;
  timestampValid?: boolean;
  timestampWarning?: string;
};

export type MarketNewsItem = {
  id: string;
  headline: string;
  source: string;
  author?: string;
  url: string;
  publishedTime: string;
  publishedLocalTime?: string;
  localDateBucket?: string;
  primaryCategory?: string;
  categories?: string[];
  category: NewsCategory | string;
  relatedTickers: string[];
  snippet: string;
  sentiment?: NewsSentiment;
  impact?: NewsImpact;
  whyItMatters?: string;
  timestampValid?: boolean;
  timestampWarning?: string;
};

export type EconomicCalendarItem = {
  id: string;
  time: string;
  event: string;
  previous: string;
  forecast: string;
  actual: string;
  impact: NewsImpact;
  relatedTickers: string[];
  marketReaction: string;
};

export type MacroNewsItem = MarketNewsItem;

export type MarketBrief = {
  tone: "Risk-On" | "Neutral" | "Risk-Off" | "Data unavailable";
  whyStocksMove: string;
  leadingSectors: string[];
  weakSectors: string[];
  watchNext: string[];
};

export type NewsFetchOptions = {
  range?: string;
  limit?: number;
};

export type NewsFeedBundle = {
  rows: MarketNewsItem[];
  source: string;
  status: string;
  delay: string;
  updatedAt: string;
  range: string;
};

const emptyMarketBrief: MarketBrief = {
  tone: "Data unavailable",
  whyStocksMove: "Market feed unavailable. Connect a news or market data provider to populate live drivers.",
  leadingSectors: [],
  weakSectors: [],
  watchNext: []
};

export async function fetchMarketNewsBundle(options: NewsFetchOptions = {}): Promise<NewsFeedBundle> {
  const range = options.range ?? "7d";
  const payload = await fetchRealMarketNews({ range, limit: options.limit ?? 30 });
  return {
    rows: (payload.data ?? []).map(articleToMarketNewsItem),
    source: payload.source,
    status: payload.status,
    delay: payload.delay,
    updatedAt: payload.updatedAt,
    range
  };
}

export async function fetchMarketNews(category: NewsCategory | "All" = "All", options: NewsFetchOptions = {}) {
  const payload = await fetchRealMarketNews({ range: options.range ?? "7d", limit: options.limit ?? 30 });
  const rows = (payload.data ?? []).map(articleToMarketNewsItem);

  if (category === "All") return rows;
  return rows.filter((item) => item.category === category);
}

export async function fetchLiveMarketFeed(category = "All", options: NewsFetchOptions = {}) {
  const rows = await fetchMarketNews(category as NewsCategory | "All", options);
  return rows.map(normalizeFeedItem);
}

export async function fetchBreakingNews(options: NewsFetchOptions = {}) {
  const rows = await fetchMarketNews("All", options);
  return rows.slice(0, 1).map(normalizeFeedItem);
}

export async function fetchMarketArticles(filter = "All", options: NewsFetchOptions = {}) {
  const rows = await fetchMarketNews("All", options);
  const filtered = filter === "All" ? rows : rows.filter((item) => item.category === filter || item.relatedTickers.includes(filter));
  return filtered.map(normalizeArticle);
}

export async function fetchTickerNews(ticker: string) {
  const payload = await fetchRealTickerNews(ticker);
  return (payload.data ?? []).map(articleToMarketNewsItem).map(normalizeArticle);
}

export async function fetchMacroNews() {
  return [] as MacroNewsItem[];
}

export async function fetchNewsByCategory(_category: string) {
  return [] as MarketNewsItem[];
}

export async function fetchEconomicCalendar() {
  return [] as EconomicCalendarItem[];
}

export async function summarizeNewsWithAI(_newsItems: MarketNewsItem[]): Promise<MarketBrief> {
  if (_newsItems.length) {
    return {
      tone: "Neutral",
      whyStocksMove: "Market tone is based on latest provider news. Quote/sector confirmation unavailable.",
      leadingSectors: Array.from(new Set(_newsItems.flatMap((item) => item.relatedTickers).filter(Boolean))).slice(0, 4),
      weakSectors: [],
      watchNext: Array.from(new Set(_newsItems.map((item) => String(item.category)))).slice(0, 4)
    };
  }

  return emptyMarketBrief;
}

export function normalizeFeedItem(rawItem: MarketNewsItem): NewsItem {
  return {
    id: rawItem.id,
    type: "feed",
    headline: rawItem.headline,
    sourceName: rawItem.source,
    author: rawItem.author,
    url: rawItem.url,
    publishedAt: rawItem.publishedTime,
    publishedLocalTime: rawItem.publishedLocalTime,
    localDateBucket: rawItem.localDateBucket,
    primaryCategory: rawItem.primaryCategory,
    categories: rawItem.categories,
    relatedTickers: rawItem.relatedTickers,
    category: rawItem.category,
    snippet: rawItem.snippet,
    sentiment: rawItem.sentiment,
    impactLevel: rawItem.impact,
    whyItMatters: rawItem.whyItMatters,
    timestampValid: rawItem.timestampValid,
    timestampWarning: rawItem.timestampWarning
  };
}

export function normalizeArticle(rawArticle: MarketNewsItem): NewsItem {
  return { ...normalizeFeedItem(rawArticle), type: "article" };
}

export function normalizeNewsItems(rawItems: MarketNewsItem[]) {
  return rawItems.map(normalizeFeedItem);
}

function articleToMarketNewsItem(article: NormalizedNewsArticle): MarketNewsItem {
  return {
    id: article.id,
    headline: article.headline,
    source: article.sourceName,
    author: article.author,
    url: article.url,
    publishedTime: article.publishedAt,
    publishedLocalTime: article.publishedLocalTime,
    localDateBucket: article.localDateBucket,
    primaryCategory: article.primaryCategory,
    categories: article.categories,
    category: article.category,
    relatedTickers: article.relatedTickers,
    snippet: article.snippet,
    sentiment: normalizeSentiment(article.sentiment),
    impact: normalizeImpact(article.impactLevel),
    whyItMatters: "This article may affect market tone, sector sentiment, or ticker-specific research context.",
    timestampValid: article.timestampValid,
    timestampWarning: article.timestampWarning
  };
}

function normalizeSentiment(sentiment?: string): NewsSentiment | undefined {
  if (!sentiment) return undefined;
  const normalized = sentiment.toLowerCase();
  if (normalized.includes("bull") || normalized.includes("positive")) return "Bullish";
  if (normalized.includes("bear") || normalized.includes("negative")) return "Bearish";
  return "Neutral";
}

function normalizeImpact(impact?: string): NewsImpact {
  if (impact === "High" || impact === "Medium" || impact === "Low") return impact;
  return "Medium";
}
import { fetchRealMarketNews, fetchRealTickerNews, type NormalizedNewsArticle } from "@/lib/provider-gateway";
export type { LocalDateBucket } from "@/lib/news-classification";
