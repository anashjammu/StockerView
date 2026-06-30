import type { ApiResponseStatus } from "@/lib/api-response";

const FMP_BASE_URL = "https://financialmodelingprep.com/api";
const CACHE_SECONDS = 300;

export type ApiPayload<T> = {
  data: T;
  source: string;
  status: Exclude<ApiResponseStatus, "error">;
  delay: string;
  updatedAt: string;
  error?: string;
};

export type FmpQuote = {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  marketCap: number;
};

export type FmpProfile = {
  symbol: string;
  companyName: string;
  price: number;
  beta: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  industry: string;
  sector: string;
  website: string;
  description: string;
};

export type FmpNews = {
  symbol: string;
  publishedDate: string;
  title: string;
  site: string;
  text: string;
  url: string;
};

export type FmpMarketNews = {
  symbol: string;
  publishedDate: string;
  title: string;
  site: string;
  text: string;
  url: string;
};

export type FmpEarnings = {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  revenue: number | null;
  revenueEstimated: number | null;
};

export type FmpFundamental = {
  metric: string;
  value: string;
  context: string;
};

export const apiCacheHeaders = {
  "Cache-Control": `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`
};

export async function getQuote(symbol: string): Promise<ApiPayload<FmpQuote | null>> {
  return withSingleFallback(symbol, () => fetchFmpArray<FmpQuote>(`/v3/quote/${symbol}`));
}

export async function getProfile(symbol: string): Promise<ApiPayload<FmpProfile | null>> {
  return withSingleFallback(symbol, () => fetchFmpArray<FmpProfile>(`/v3/profile/${symbol}`));
}

export async function getTickerNews(symbol: string): Promise<ApiPayload<FmpNews[]>> {
  return withListFallback(symbol, () => fetchFmpArray<FmpNews>(`/v3/stock_news?tickers=${encodeURIComponent(symbol)}&limit=10`));
}

export async function getMarketNews(): Promise<ApiPayload<FmpMarketNews[]>> {
  return withListFallback("MARKET", () => fetchFmpArray<FmpMarketNews>("/v3/stock_news?limit=20"));
}

export async function getEarnings(symbol: string): Promise<ApiPayload<FmpEarnings[]>> {
  return withListFallback(symbol, () => fetchFmpArray<FmpEarnings>(`/v3/historical/earning_calendar/${symbol}?limit=8`));
}

export async function getFundamentals(symbol: string): Promise<ApiPayload<FmpFundamental[]>> {
  return withListFallback(symbol, () => fetchFmpArray<FmpFundamental>(`/v3/key-metrics-ttm/${symbol}`));
}

async function withSingleFallback<T>(symbol: string, fetcher: () => Promise<T[]>): Promise<ApiPayload<T | null>> {
  try {
    const data = await fetcher();

    if (data.length > 0) {
      return realPayload(data[0]);
    }

    return unavailablePayload(null, `${symbol} is not available from Financial Modeling Prep.`);
  } catch (error) {
    return unavailablePayload(null, publicProviderError(error));
  }
}

async function withListFallback<T>(symbol: string, fetcher: () => Promise<T[]>): Promise<ApiPayload<T[]>> {
  try {
    const data = await fetcher();

    if (data.length > 0) {
      return realPayload(data);
    }

    return unavailablePayload([], `${symbol} is not available from Financial Modeling Prep.`);
  } catch (error) {
    return unavailablePayload([], publicProviderError(error));
  }
}

function realPayload<T>(data: T): ApiPayload<T> {
  return {
    data,
    source: "Financial Modeling Prep",
    status: "delayed",
    delay: "15 minutes",
    updatedAt: new Date().toISOString()
  };
}

function unavailablePayload<T>(data: T, error: string): ApiPayload<T> {
  return {
    data,
    source: "Unavailable",
    status: "unavailable",
    delay: "N/A",
    updatedAt: new Date().toISOString(),
    error
  };
}

function publicProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : "Provider request failed.";

  if (message.includes("API key")) {
    return "Real data provider is not configured.";
  }

  if (message.includes("429") || message.toLowerCase().includes("limit")) {
    return "API limit reached. Try again later.";
  }

  return "Real data unavailable.";
}

async function fetchFmpArray<T>(path: string): Promise<T[]> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    throw new Error("FMP_API_KEY is not configured.");
  }

  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${FMP_BASE_URL}${path}${separator}apikey=${apiKey}`, {
    next: { revalidate: CACHE_SECONDS }
  });

  if (!response.ok) {
    throw new Error(`FMP request failed with status ${response.status}.`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("FMP returned an unexpected response shape.");
  }

  return data as T[];
}
