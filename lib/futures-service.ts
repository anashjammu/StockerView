import { buildEmptyCandleSet } from "@/lib/chart-data";
import { fetchTickerNews, type NewsItem } from "@/lib/news-service";
import { serverEnv } from "@/lib/server/env";
import { fetchFutureProfile, fetchTickerOverview, type FutureProfile, type FutureTickerOverview } from "@/lib/ticker-service";
import { formatChange } from "@/lib/utils";

export type FuturesInfoItem = {
  label: string;
  value: string;
};

export type FuturesPageData = {
  overview: FutureTickerOverview;
  profile: FutureProfile;
  chart: ReturnType<typeof buildEmptyCandleSet>;
  sessionSnapshot: FuturesInfoItem[];
  contractSpecs: FuturesInfoItem[];
  marketDrivers: string[];
  relatedMarkets: string[];
  feedItems: NewsItem[];
  source: string;
  status: "Delayed" | "Unavailable";
  delay: string;
  updatedAt: string;
};

type FuturesProviderQuote = {
  price: number;
  change: number;
  volume?: string;
  previousClose?: string;
  sessionHigh?: string;
  sessionLow?: string;
  source: string;
  status: "Delayed";
  delay: string;
  updatedAt: string;
};

export function getFuturesMetadata(symbol: string) {
  return fetchFutureProfile(symbol);
}

export function getFuturesSessionSnapshot(profile: FutureProfile, price: number, change: number, volume: string): FuturesInfoItem[] {
  return [
    { label: "Last Price", value: price > 0 ? `$${price.toFixed(2)}` : "Data unavailable" },
    { label: "Daily Change", value: formatChange(change) },
    { label: "Open", value: profile.open },
    { label: "High", value: profile.sessionHigh },
    { label: "Low", value: profile.sessionLow },
    { label: "Previous Close", value: profile.previousClose },
    { label: "Volume", value: volume },
    { label: "Open Interest", value: profile.openInterest },
    { label: "Session Range", value: `${profile.sessionLow} - ${profile.sessionHigh}` },
    { label: "Overnight High", value: profile.overnightHigh },
    { label: "Overnight Low", value: profile.overnightLow },
    { label: "VWAP", value: profile.vwap },
    { label: "Implied Direction", value: profile.impliedDirection },
    { label: "Risk Tone", value: profile.category === "Index Futures" ? "Nasdaq vs S&P leadership in focus" : "Macro-sensitive contract" }
  ];
}

export function getFuturesContractSpecs(profile: FutureProfile): FuturesInfoItem[] {
  return [
    { label: "Contract Name", value: profile.name },
    { label: "Root Symbol", value: profile.rootSymbol },
    { label: "Contract Month", value: profile.contractMonth },
    { label: "Exchange", value: profile.exchange },
    { label: "Tick Size", value: profile.tickSize },
    { label: "Tick Value", value: profile.tickValue },
    { label: "Point Value", value: profile.pointValue },
    { label: "Contract Size", value: profile.contractSize },
    { label: "Trading Hours", value: profile.tradingHours },
    { label: "Expiration Date", value: profile.expirationDate },
    { label: "Settlement Type", value: profile.settlementType },
    { label: "Margin", value: profile.marginPlaceholder }
  ];
}

export function getFuturesMarketDrivers(profile: FutureProfile) {
  if (profile.category === "Index Futures") {
    return ["Equity risk sentiment", "Treasury yields", "Fed expectations", "Mega-cap tech strength", "Economic calendar", "Volatility / VIX", "Dollar strength"];
  }

  if (profile.category === "Energy") {
    return ["Supply and demand balance", "Inventory reports", "OPEC headlines", "Geopolitical risk", "Dollar movement", "Weather sensitivity"];
  }

  if (profile.category === "Metals") {
    return ["Real yields", "Dollar index", "Inflation expectations", "Fed policy", "Safe-haven demand", "Geopolitical risk"];
  }

  if (profile.category === "Rates") {
    return ["Treasury yields", "Fed rate expectations", "CPI/PCE/jobs data", "Auction demand", "Dollar movement", "Risk-off flows"];
  }

  return ["Macro data", "Dollar movement", "Liquidity", "Volatility", "Cross-market risk sentiment"];
}

export function getFuturesRelatedMarkets(symbol: string) {
  const related: Record<string, string[]> = {
    ES: ["SPY", "QQQ", "NQ", "RTY", "VIX"],
    NQ: ["QQQ", "NVDA", "AMD", "MSFT", "ES", "ZN"],
    YM: ["DIA", "ES", "RTY", "XLI", "JPM"],
    RTY: ["IWM", "ES", "IJR", "KRE", "ZN"],
    CL: ["USO", "XLE", "XOM", "CVX", "NG", "DXY"],
    NG: ["UNG", "CL", "XLE"],
    GC: ["GLD", "GDX", "SI", "DXY", "ZN", "TLT"],
    SI: ["SLV", "GC", "DXY", "COPPER"],
    ZN: ["TLT", "IEF", "ZB", "ZF", "DXY", "NQ", "GLD"],
    ZB: ["TLT", "ZN", "DXY", "GLD", "NQ"],
    ZF: ["IEF", "ZN", "ZT", "TLT", "DXY"],
    ZT: ["SHY", "ZF", "ZN", "DXY"],
    DX: ["UUP", "GC", "SI", "CL", "ZN"]
  };

  return related[symbol] ?? ["SPY", "QQQ", "TLT", "DXY"];
}

export async function getFuturesFeed(symbol: string, profile: FutureProfile) {
  void profile;
  const news = await fetchTickerNews(symbol);
  return news;
}

export async function getFuturesPageData(symbol: string): Promise<FuturesPageData | null> {
  const overview = fetchTickerOverview(symbol);

  if (overview.assetType !== "future") {
    return null;
  }

  const profile = overview.futureProfile;
  const providerQuote = await getFuturesProviderQuote(overview.symbol);
  const mergedOverview = providerQuote
    ? {
        ...overview,
        price: providerQuote.price,
        change: providerQuote.change,
        volume: providerQuote.volume ?? overview.volume,
        previousClose: providerQuote.previousClose ?? overview.previousClose,
        sessionHigh: providerQuote.sessionHigh ?? overview.sessionHigh,
        sessionLow: providerQuote.sessionLow ?? overview.sessionLow
      }
    : overview;
  const mergedProfile = providerQuote
    ? {
        ...profile,
        previousClose: providerQuote.previousClose ?? profile.previousClose,
        sessionHigh: providerQuote.sessionHigh ?? profile.sessionHigh,
        sessionLow: providerQuote.sessionLow ?? profile.sessionLow
      }
    : profile;
  const feedItems = await getFuturesFeed(overview.symbol, profile);

  return {
    overview: mergedOverview,
    profile: mergedProfile,
    chart: buildEmptyCandleSet(),
    sessionSnapshot: getFuturesSessionSnapshot(mergedProfile, mergedOverview.price, mergedOverview.change, mergedOverview.volume),
    contractSpecs: getFuturesContractSpecs(mergedProfile),
    marketDrivers: getFuturesMarketDrivers(mergedProfile),
    relatedMarkets: getFuturesRelatedMarkets(mergedProfile.symbol),
    feedItems,
    source: providerQuote?.source ?? "Unavailable",
    status: providerQuote?.status ?? "Unavailable",
    delay: providerQuote?.delay ?? "N/A",
    updatedAt: providerQuote?.updatedAt ?? new Date().toISOString()
  };
}

async function getFuturesProviderQuote(symbol: string): Promise<FuturesProviderQuote | null> {
  const providers = [
    serverEnv.yahooFinanceEnabled ? fetchYahooFuturesQuote : null,
    fetchFmpCommoditiesQuote,
    fetchTwelveDataFuturesQuote,
    fetchStooqFuturesQuote
  ].filter((provider): provider is (symbol: string) => Promise<FuturesProviderQuote | null> => Boolean(provider));

  for (const provider of providers) {
    try {
      const quote = await provider(symbol);

      if (quote) {
        return quote;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchYahooFuturesQuote(symbol: string): Promise<FuturesProviderQuote | null> {
  const yahooSymbol = yahooFuturesSymbols[symbol];

  if (!yahooSymbol) {
    return null;
  }

  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=5m`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || typeof meta.regularMarketPrice !== "number") {
    return null;
  }

  const previousClose = meta.chartPreviousClose ?? meta.previousClose;
  const change = typeof previousClose === "number" && previousClose !== 0 ? ((meta.regularMarketPrice - previousClose) / previousClose) * 100 : 0;

  return {
    price: meta.regularMarketPrice,
    change,
    volume: formatProviderVolume(meta.regularMarketVolume),
    previousClose: typeof previousClose === "number" ? previousClose.toFixed(2) : undefined,
    sessionHigh: typeof meta.regularMarketDayHigh === "number" ? meta.regularMarketDayHigh.toFixed(2) : undefined,
    sessionLow: typeof meta.regularMarketDayLow === "number" ? meta.regularMarketDayLow.toFixed(2) : undefined,
    source: "Yahoo Finance",
    status: "Delayed",
    delay: "Provider-dependent",
    updatedAt: new Date().toISOString()
  };
}

async function fetchFmpCommoditiesQuote(_symbol: string): Promise<FuturesProviderQuote | null> {
  return null;
}

async function fetchTwelveDataFuturesQuote(_symbol: string): Promise<FuturesProviderQuote | null> {
  return null;
}

async function fetchStooqFuturesQuote(_symbol: string): Promise<FuturesProviderQuote | null> {
  return null;
}

function formatProviderVolume(volume?: number) {
  if (typeof volume !== "number") {
    return undefined;
  }

  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }

  if (volume >= 1_000) {
    return `${Math.round(volume / 1_000)}K`;
  }

  return `${volume}`;
}

const yahooFuturesSymbols: Record<string, string> = {
  ES: "ES=F",
  NQ: "NQ=F",
  YM: "YM=F",
  RTY: "RTY=F",
  CL: "CL=F",
  NG: "NG=F",
  GC: "GC=F",
  SI: "SI=F",
  ZN: "ZN=F",
  ZB: "ZB=F",
  ZF: "ZF=F",
  ZT: "ZT=F",
  DX: "DX-Y.NYB"
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketVolume?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
    }>;
  };
};
