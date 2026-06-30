import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchEconomicCalendar } from "@/lib/news-service";

export async function GET() {
  return NextResponse.json(successResponse(await fetchEconomicCalendar()));
}
