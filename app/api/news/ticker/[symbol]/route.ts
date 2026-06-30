import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealTickerNews, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const url = new URL(request.url);
  const payload = await fetchRealTickerNews(decodeURIComponent(symbol).trim().toUpperCase(), {
    range: url.searchParams.get("range") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 20)
  });
  return NextResponse.json(
    {
      ...successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}
