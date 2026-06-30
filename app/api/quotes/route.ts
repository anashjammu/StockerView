import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchBatchQuotes } from "@/lib/market-data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get("symbols") ?? "SPY,QQQ,NVDA,MSFT,AAPL").split(",").map((symbol) => symbol.trim().toUpperCase());

  const payload = fetchBatchQuotes(symbols);
  return NextResponse.json(successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }));
}
