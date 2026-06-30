import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchSectorPerformance } from "@/lib/market-data-service";

export async function GET() {
  const payload = fetchSectorPerformance();
  return NextResponse.json(successResponse(payload.data, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }));
}
