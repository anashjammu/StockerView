import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { apiCacheHeaders, getMarketNews } from "@/lib/fmp-service";

export async function GET() {
  const payload = await getMarketNews();

  return NextResponse.json(
    {
      ...successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error
    },
    { headers: apiCacheHeaders }
  );
}
