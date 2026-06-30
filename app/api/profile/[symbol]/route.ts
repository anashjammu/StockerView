import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealProfile, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const payload = await fetchRealProfile(decodeURIComponent(symbol).trim().toUpperCase());

  return NextResponse.json(
    {
      ...successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}
