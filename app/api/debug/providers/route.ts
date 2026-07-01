import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/server/env";

type ProviderDebug = {
  keyPresent: boolean;
  attempted: boolean;
  httpStatus: number | null;
  dataPresent: boolean;
  responseKeys: string[];
  error?: string;
};

export async function GET() {
  const [fmp, finnhub, fred, marketaux, alphaVantage, twelveData] = await Promise.all([
    testJson("fmp", Boolean(serverEnv.fmpApiKey), `https://financialmodelingprep.com/stable/quote?symbol=NVDA&apikey=${serverEnv.fmpApiKey}`, (data) => Array.isArray(data) && data.length > 0),
    testJson("finnhub", Boolean(serverEnv.finnhubApiKey), `https://finnhub.io/api/v1/quote?symbol=NVDA&token=${serverEnv.finnhubApiKey}`, (data) => Boolean(asRecord(data).c)),
    testJson("fred", Boolean(serverEnv.fredApiKey), `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${serverEnv.fredApiKey}&file_type=json&sort_order=desc&limit=5`, (data) => Array.isArray(asRecord(data).observations)),
    testJson("marketaux", Boolean(serverEnv.marketauxApiKey), `https://api.marketaux.com/v1/news/all?language=en&limit=3&api_token=${serverEnv.marketauxApiKey}`, (data) => Array.isArray(asRecord(data).data)),
    testJson("alphaVantage", Boolean(serverEnv.alphaVantageApiKey), `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${serverEnv.alphaVantageApiKey}`, (data) => Boolean(asRecord(data)["Global Quote"])),
    testJson("twelveData", Boolean(serverEnv.twelveDataApiKey), `https://api.twelvedata.com/time_series?symbol=NVDA&interval=1day&outputsize=5&apikey=${serverEnv.twelveDataApiKey}`, (data) => Array.isArray(asRecord(data).values))
  ]);

  return NextResponse.json({ fmp, finnhub, fred, marketaux, alphaVantage, twelveData });
}

async function testJson(name: string, keyPresent: boolean, url: string, hasUsableData: (data: unknown) => boolean): Promise<ProviderDebug> {
  if (!keyPresent) {
    return { keyPresent, attempted: false, httpStatus: null, dataPresent: false, responseKeys: [], error: `${name} key missing` };
  }

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    const data = await response.json().catch(() => null);
    return {
      keyPresent,
      attempted: true,
      httpStatus: response.status,
      dataPresent: response.ok && hasUsableData(data),
      responseKeys: responseShapeKeys(data),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch {
    return {
      keyPresent,
      attempted: true,
      httpStatus: null,
      dataPresent: false,
      responseKeys: [],
      error: "request failed"
    };
  }
}

function responseShapeKeys(data: unknown) {
  if (Array.isArray(data)) return ["array", `length:${data.length}`];
  if (data && typeof data === "object") return Object.keys(data as Record<string, unknown>).slice(0, 8);
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
