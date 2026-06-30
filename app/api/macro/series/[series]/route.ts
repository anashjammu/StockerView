import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchFredSeries, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ series: string }> }) {
  const { series } = await params;
  const payload = await fetchFredSeries(decodeURIComponent(series).trim().toUpperCase());

  return NextResponse.json(
    {
      ...successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}
