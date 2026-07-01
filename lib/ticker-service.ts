import { trackedTickerSignals, trackedTickers, type Ticker } from "@/lib/app-data";
import {
  fetchEarnings as fetchMarketEarnings,
  fetchFundamentals as fetchMarketFundamentals,
  fetchHistoricalPrices as fetchMarketHistoricalPrices,
  fetchQuote as fetchMarketQuote
} from "@/lib/market-data-service";

export type AssetType = "stock" | "ETF" | "index" | "future" | "crypto" | "unknown";

export type SymbolLookupResult = {
  symbol: string;
  name: string;
  assetType: AssetType;
  category?: string;
  exchange?: string;
  rootSymbol?: string;
  contractMonth?: string;
  tickSize?: string;
  tickValue?: string;
  pointValue?: string;
};

export type ETFProfile = {
  symbol: string;
  name: string;
  expenseRatio: string;
  aum: string;
  holdingsCount: string;
  topHoldings: string[];
  sectorExposure: { label: string; value: number }[];
  dividendYield: string;
};

export type FutureProfile = {
  symbol: string;
  name: string;
  category: string;
  exchange: string;
  rootSymbol: string;
  contractCode: string;
  sessionHigh: string;
  sessionLow: string;
  open: string;
  previousClose: string;
  overnightHigh: string;
  overnightLow: string;
  vwap: string;
  impliedDirection: string;
  openInterest: string;
  contractMonth: string;
  tickSize: string;
  tickValue: string;
  pointValue: string;
  contractSize: string;
  tradingHours: string;
  expirationDate: string;
  settlementType: string;
  marginPlaceholder: string;
};

export type TickerDataStatus = "unavailable" | "delayed" | "live";

export type BaseTickerOverview = {
  symbol: string;
  name: string;
  assetType: AssetType;
  price: number;
  change: number;
  changePercent: number;
  source: string;
  status: TickerDataStatus;
  updatedAt: string;
};

export type StockTickerOverview = BaseTickerOverview & {
  assetType: "stock";
  volume: string;
  marketCap: string;
  sector: string;
  pe: string;
  forwardPe: string;
  revenueGrowth: number;
  epsGrowth: number;
  grossMargin: string;
  debtEquity: string;
  averageVolume: string;
  relativeVolume: string;
  earningsDate?: string;
};

export type EtfTickerOverview = BaseTickerOverview & {
  assetType: "ETF";
  volume: string;
  marketCap: string;
  aum: string;
  sector: string;
  pe: "N/A";
  forwardPe: "N/A";
  revenueGrowth: number;
  epsGrowth: number;
  grossMargin: "N/A";
  debtEquity: "N/A";
  averageVolume: string;
  relativeVolume: string;
  etfProfile: ETFProfile;
};

export type IndexTickerOverview = BaseTickerOverview & {
  assetType: "index";
  volume: string;
  marketCap: string;
  sector: string;
  pe: "N/A";
  forwardPe: "N/A";
  revenueGrowth: number;
  epsGrowth: number;
  grossMargin: "N/A";
  debtEquity: "N/A";
  averageVolume: string;
  relativeVolume: string;
};

export type FutureTickerOverview = BaseTickerOverview & {
  assetType: "future";
  contractName: string;
  contractMonth: string;
  exchange: string;
  category: string;
  rootSymbol: string;
  volume: string;
  openInterest: string;
  sessionHigh: string;
  sessionLow: string;
  previousClose: string;
  tickSize: string;
  tickValue: string;
  pointValue: string;
  futureProfile: FutureProfile;
};

export type UnknownTickerOverview = BaseTickerOverview & {
  assetType: "unknown" | "crypto";
  volume: string;
  marketCap: string;
  sector: string;
  pe: string;
  forwardPe: string;
  revenueGrowth: number;
  epsGrowth: number;
  grossMargin: string;
  debtEquity: string;
  averageVolume: string;
  relativeVolume: string;
};

export type TickerOverview = StockTickerOverview | EtfTickerOverview | IndexTickerOverview | FutureTickerOverview | UnknownTickerOverview;

const symbolDirectory: SymbolLookupResult[] = [
  { symbol: "NVDA", name: "NVIDIA Corp.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "MU", name: "Micron Technology", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", assetType: "stock", exchange: "NYSE" },
  { symbol: "IONQ", name: "IonQ", assetType: "stock", exchange: "NYSE" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetType: "ETF", exchange: "NASDAQ" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", assetType: "ETF", exchange: "NYSE Arca" },
  { symbol: "TSLA", name: "Tesla Inc.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "AAPL", name: "Apple Inc.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "ES", name: "S&P 500 Futures", assetType: "future", category: "Index Futures", exchange: "CME", rootSymbol: "ES", contractMonth: "Sep 2026", tickSize: "0.25", tickValue: "$12.50", pointValue: "$50" },
  { symbol: "NQ", name: "Nasdaq 100 Futures", assetType: "future", category: "Index Futures", exchange: "CME", rootSymbol: "NQ", contractMonth: "Sep 2026", tickSize: "0.25", tickValue: "$5.00", pointValue: "$20" },
  { symbol: "YM", name: "Dow Futures", assetType: "future", category: "Index Futures", exchange: "CBOT", rootSymbol: "YM", contractMonth: "Sep 2026", tickSize: "1", tickValue: "$5.00", pointValue: "$5" },
  { symbol: "RTY", name: "Russell 2000 Futures", assetType: "future", category: "Index Futures", exchange: "CME", rootSymbol: "RTY", contractMonth: "Sep 2026", tickSize: "0.10", tickValue: "$5.00", pointValue: "$50" },
  { symbol: "CL", name: "Crude Oil Futures", assetType: "future", category: "Energy", exchange: "NYMEX", rootSymbol: "CL", contractMonth: "Sep 2026", tickSize: "0.01", tickValue: "$10.00", pointValue: "$1,000" },
  { symbol: "NG", name: "Natural Gas Futures", assetType: "future", category: "Energy", exchange: "NYMEX", rootSymbol: "NG", contractMonth: "Sep 2026", tickSize: "0.001", tickValue: "$10.00", pointValue: "$10,000" },
  { symbol: "GC", name: "Gold Futures", assetType: "future", category: "Metals", exchange: "COMEX", rootSymbol: "GC", contractMonth: "Dec 2026", tickSize: "0.10", tickValue: "$10.00", pointValue: "$100" },
  { symbol: "SI", name: "Silver Futures", assetType: "future", category: "Metals", exchange: "COMEX", rootSymbol: "SI", contractMonth: "Dec 2026", tickSize: "0.005", tickValue: "$25.00", pointValue: "$5,000" },
  { symbol: "ZN", name: "10Y Treasury Note Futures", assetType: "future", category: "Rates", exchange: "CBOT", rootSymbol: "ZN", contractMonth: "Sep 2026", tickSize: "1/64", tickValue: "$15.625", pointValue: "$1,000" },
  { symbol: "ZB", name: "30Y Treasury Bond Futures", assetType: "future", category: "Rates", exchange: "CBOT", rootSymbol: "ZB", contractMonth: "Sep 2026", tickSize: "1/32", tickValue: "$31.25", pointValue: "$1,000" },
  { symbol: "ZF", name: "5Y Treasury Note Futures", assetType: "future", category: "Rates", exchange: "CBOT", rootSymbol: "ZF", contractMonth: "Sep 2026", tickSize: "1/128", tickValue: "$7.8125", pointValue: "$1,000" },
  { symbol: "ZT", name: "2Y Treasury Note Futures", assetType: "future", category: "Rates", exchange: "CBOT", rootSymbol: "ZT", contractMonth: "Sep 2026", tickSize: "1/256", tickValue: "$7.8125", pointValue: "$2,000" },
  { symbol: "DX", name: "Dollar Index Futures", assetType: "future", category: "Currencies", exchange: "ICE", rootSymbol: "DX", contractMonth: "Sep 2026", tickSize: "0.005", tickValue: "$5.00", pointValue: "$1,000" }
];

const etfProfiles: Record<string, ETFProfile> = {};

const futureProfiles: Record<string, FutureProfile> = {
  ES: futureProfile("ES", "S&P 500 Futures", "Index Futures", "CME", "0.25", "$12.50", "$50", "$50 x S&P 500 Index", "Cash settled"),
  NQ: futureProfile("NQ", "Nasdaq 100 Futures", "Index Futures", "CME", "0.25", "$5.00", "$20", "$20 x Nasdaq 100 Index", "Cash settled"),
  YM: futureProfile("YM", "Dow Futures", "Index Futures", "CBOT", "1", "$5.00", "$5", "$5 x Dow Jones Industrial Average", "Cash settled"),
  RTY: futureProfile("RTY", "Russell 2000 Futures", "Index Futures", "CME", "0.10", "$5.00", "$50", "$50 x Russell 2000 Index", "Cash settled"),
  CL: futureProfile("CL", "Crude Oil Futures", "Energy", "NYMEX", "0.01", "$10.00", "$1,000", "1,000 barrels", "Physical delivery"),
  NG: futureProfile("NG", "Natural Gas Futures", "Energy", "NYMEX", "0.001", "$10.00", "$10,000", "10,000 MMBtu", "Physical delivery"),
  GC: futureProfile("GC", "Gold Futures", "Metals", "COMEX", "0.10", "$10.00", "$100", "100 troy ounces", "Physical delivery"),
  SI: futureProfile("SI", "Silver Futures", "Metals", "COMEX", "0.005", "$25.00", "$5,000", "5,000 troy ounces", "Physical delivery"),
  ZN: futureProfile("ZN", "10Y Treasury Note Futures", "Rates", "CBOT", "1/64", "$15.625", "$1,000", "$100,000 face value", "Physical delivery"),
  ZB: futureProfile("ZB", "30Y Treasury Bond Futures", "Rates", "CBOT", "1/32", "$31.25", "$1,000", "$100,000 face value", "Physical delivery"),
  ZF: futureProfile("ZF", "5Y Treasury Note Futures", "Rates", "CBOT", "1/128", "$7.8125", "$1,000", "$100,000 face value", "Physical delivery"),
  ZT: futureProfile("ZT", "2Y Treasury Note Futures", "Rates", "CBOT", "1/256", "$7.8125", "$2,000", "$200,000 face value", "Physical delivery"),
  DX: futureProfile("DX", "Dollar Index Futures", "Currencies", "ICE", "0.005", "$5.00", "$1,000", "$1,000 x index value", "Cash settled")
};

function futureProfile(symbol: string, name: string, category: string, exchange: string, tickSize: string, tickValue: string, pointValue: string, contractSize: string, settlementType: string): FutureProfile {
  return {
    symbol,
    name,
    category,
    exchange,
    rootSymbol: symbol,
    contractCode: "Data unavailable",
    open: "Data unavailable",
    previousClose: "Data unavailable",
    sessionHigh: "Data unavailable",
    sessionLow: "Data unavailable",
    overnightHigh: "Data unavailable",
    overnightLow: "Data unavailable",
    vwap: "Data unavailable",
    impliedDirection: "Data unavailable",
    openInterest: "Data unavailable",
    contractMonth: "Data unavailable",
    tickSize,
    tickValue,
    pointValue,
    contractSize,
    tradingHours: "Sun-Fri, nearly 24 hours with daily maintenance break",
    expirationDate: "Data unavailable",
    settlementType,
    marginPlaceholder: "Data unavailable"
  };
}

export function searchSymbols(query: string) {
  const normalized = query.trim().toUpperCase();

  if (!normalized) {
    return symbolDirectory;
  }

  return symbolDirectory
    .filter((item) => item.symbol.includes(normalized) || item.name.toUpperCase().includes(normalized))
    .slice(0, 8);
}

export function fetchTickerOverview(symbol: string): TickerOverview {
  const normalized = symbol.toUpperCase();
  const listedTicker = trackedTickers.find((item) => item.symbol === normalized);
  const trackedTicker = trackedTickerSignals.find((item) => item.symbol === normalized);
  const directory = symbolDirectory.find((item) => item.symbol === normalized);
  const etfProfile = fetchETFProfile(normalized) ?? (directory?.assetType === "ETF" ? unavailableETFProfile(normalized, directory.name) : null);
  const futureProfile = fetchFutureProfile(normalized);
  const assetType = futureProfile ? "future" : directory?.assetType ?? (etfProfile ? "ETF" : "stock");
  const base = {
    symbol: normalized,
    name: futureProfile?.name ?? etfProfile?.name ?? directory?.name ?? trackedTicker?.name ?? listedTicker?.name ?? normalized,
    price: 0,
    change: 0,
    changePercent: 0,
    source: "Unavailable",
    status: "unavailable" as const,
    updatedAt: new Date().toISOString()
  };

  if (futureProfile) {
    return {
      ...base,
      assetType: "future",
      contractName: futureProfile.name,
      contractMonth: futureProfile.contractMonth,
      exchange: futureProfile.exchange,
      category: futureProfile.category,
      rootSymbol: futureProfile.rootSymbol,
      volume: "Data unavailable",
      openInterest: futureProfile.openInterest,
      sessionHigh: futureProfile.sessionHigh,
      sessionLow: futureProfile.sessionLow,
      previousClose: futureProfile.previousClose,
      tickSize: futureProfile.tickSize,
      tickValue: futureProfile.tickValue,
      pointValue: futureProfile.pointValue,
      futureProfile
    };
  }

  if (etfProfile) {
    return {
      ...base,
      assetType: "ETF",
      volume: "Data unavailable",
      marketCap: etfProfile.aum,
      aum: etfProfile.aum,
      sector: "ETF",
      pe: "N/A",
      forwardPe: "N/A",
      revenueGrowth: 0,
      epsGrowth: 0,
      grossMargin: "N/A",
      debtEquity: "N/A",
      averageVolume: "Data unavailable",
      relativeVolume: "Data unavailable",
      etfProfile
    };
  }

  if (assetType === "index") {
    return {
      ...base,
      assetType: "index",
      volume: "Data unavailable",
      marketCap: "N/A",
      sector: "Index",
      pe: "N/A",
      forwardPe: "N/A",
      revenueGrowth: 0,
      epsGrowth: 0,
      grossMargin: "N/A",
      debtEquity: "N/A",
      averageVolume: "Data unavailable",
      relativeVolume: "Data unavailable"
    };
  }

  if (assetType === "crypto" || assetType === "unknown") {
    return {
      ...base,
      assetType,
      volume: "Data unavailable",
      marketCap: "Data unavailable",
      sector: "Data unavailable",
      pe: "N/A",
      forwardPe: "N/A",
      revenueGrowth: 0,
      epsGrowth: 0,
      grossMargin: "N/A",
      debtEquity: "N/A",
      averageVolume: "Data unavailable",
      relativeVolume: "Data unavailable"
    };
  }

  return {
    ...base,
    assetType: "stock",
    volume: "Data unavailable",
    marketCap: "Data unavailable",
    sector: "Data unavailable",
    pe: "Data unavailable",
    forwardPe: "Data unavailable",
    revenueGrowth: 0,
    epsGrowth: 0,
    grossMargin: "Data unavailable",
    debtEquity: "Data unavailable",
    averageVolume: "Data unavailable",
    relativeVolume: "Data unavailable",
    earningsDate: undefined
  };
}

function unavailableETFProfile(symbol: string, name: string): ETFProfile {
  return {
    symbol,
    name,
    expenseRatio: "Data unavailable",
    aum: "Data unavailable",
    holdingsCount: "Data unavailable",
    topHoldings: [],
    sectorExposure: [],
    dividendYield: "Data unavailable"
  };
}

export function fetchETFProfile(symbol: string) {
  return etfProfiles[symbol.toUpperCase()] ?? null;
}

export function fetchFutureProfile(symbol: string) {
  return futureProfiles[symbol.toUpperCase()] ?? null;
}

export function fetchPeers(symbol: string): Ticker[] {
  const normalized = symbol.toUpperCase();
  const peerMap: Record<string, string[]> = {
    NVDA: ["AMD", "AVGO", "TSM", "ARM", "MU", "INTC", "QCOM"],
    AMD: ["NVDA", "AVGO", "TSM", "MU", "INTC", "QCOM"],
    MU: ["NVDA", "AMD", "AVGO", "TSM", "INTC", "QCOM"],
    AAPL: ["MSFT", "GOOGL", "AMZN", "META"],
    TSLA: ["GM", "F", "RIVN", "NIO"]
  };

  const symbols = peerMap[normalized] ?? [];
  return symbols.map((peerSymbol) => {
    const overview = fetchTickerOverview(peerSymbol);
    return {
      symbol: peerSymbol,
      name: overview.name,
      price: 0,
      change: 0,
      volume: overview.volume,
      sector: overview.assetType === "stock" ? overview.sector : "Unavailable"
    };
  });
}

export function fetchCompanyProfile(symbol: string) {
  const overview = fetchTickerOverview(symbol);
  return overview.assetType === "ETF" || overview.assetType === "future" ? null : overview;
}

export function fetchQuote(symbol: string) {
  return fetchMarketQuote(symbol);
}

export function fetchHistoricalPrices(symbol: string, _timeframe = "1D") {
  return fetchMarketHistoricalPrices(symbol);
}

export function fetchFundamentals(symbol: string) {
  return fetchMarketFundamentals(symbol);
}

export function fetchEarnings(symbol: string) {
  return fetchMarketEarnings(symbol);
}

