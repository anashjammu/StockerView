import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    FMP_API_KEY: Boolean(process.env.FMP_API_KEY),
    FINNHUB_API_KEY: Boolean(process.env.FINNHUB_API_KEY),
    FRED_API_KEY: Boolean(process.env.FRED_API_KEY),
    MARKETAUX_API_KEY: Boolean(process.env.MARKETAUX_API_KEY),
    ALPHA_VANTAGE_API_KEY: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
    ALPACA_API_KEY: Boolean(process.env.ALPACA_API_KEY),
    ALPACA_SECRET_KEY: Boolean(process.env.ALPACA_SECRET_KEY),
    TWELVE_DATA_API_KEY: Boolean(process.env.TWELVE_DATA_API_KEY),
    ENABLE_MOCK_DATA: process.env.ENABLE_MOCK_DATA === "true" ? "true" : "false",
    NODE_ENV: process.env.NODE_ENV,
    runtime: "server"
  });
}
