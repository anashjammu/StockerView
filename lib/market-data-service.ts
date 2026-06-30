import { factorExposure, heatMap, marketIndices, morningMovers, stockEarnings, stockFundamentals, trackedTickerSignals, trackedTickers } from "@/lib/app-data";
import { buildEmptyCandleSet } from "@/lib/chart-data";

export type DataSource = "Unavailable" | "FMP" | "Alpaca" | "FRED" | "Finnhub";
export type DataStatus = "unavailable" | "delayed" | "live";

export type MarketDataResponse<T> = {
  data: T;
  source: DataSource;
  status: DataStatus;
  delay: string;
  updatedAt: string;
};

function wrap<T>(data: T): MarketDataResponse<T> {
  return {
    data,
    source: "Unavailable",
    status: "unavailable",
    delay: "N/A",
    updatedAt: new Date().toISOString()
  };
}

export function fetchQuote(symbol: string) {
  const normalized = symbol.toUpperCase();
  const fromTickerList = trackedTickers.find((item) => item.symbol === normalized);
  const fromTickerSignals = trackedTickerSignals.find((item) => item.symbol === normalized);

  return wrap(fromTickerList ?? fromTickerSignals ?? null);
}

export function fetchBatchQuotes(symbols: string[]) {
  return wrap(symbols.map((symbol) => fetchQuote(symbol).data).filter(Boolean));
}

export function fetchIndexData() {
  return wrap(marketIndices);
}

export function fetchHistoricalPrices(symbol: string) {
  void symbol;
  return wrap(buildEmptyCandleSet());
}

export function fetchCompanyProfile(symbol: string) {
  const quote = fetchQuote(symbol).data;
  return wrap(
    quote
      ? {
          symbol: quote.symbol,
          name: "name" in quote ? quote.name : "Data unavailable",
          sector: "sector" in quote ? quote.sector : "Data unavailable",
          description: "Company profile unavailable. Connect a provider such as FMP or Finnhub for profile data."
        }
      : null
  );
}

export function fetchFundamentals(symbol: string) {
  return wrap({ symbol: symbol.toUpperCase(), fundamentals: stockFundamentals });
}

export function fetchEarnings(symbol: string) {
  return wrap({ symbol: symbol.toUpperCase(), earnings: stockEarnings });
}

export function fetchMarketMovers() {
  return wrap(morningMovers);
}

export function fetchSectorPerformance() {
  return wrap(heatMap);
}

export function fetchFactorExposure() {
  return wrap(factorExposure);
}
