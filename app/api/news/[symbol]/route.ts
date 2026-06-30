import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { apiCacheHeaders, getTickerNews } from "@/lib/fmp-service";

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const payload = await getTickerNews(decodeURIComponent(symbol).trim().toUpperCase());

  return NextResponse.json(
    {
      ...successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error
    },
    { headers: apiCacheHeaders }
  );
}
