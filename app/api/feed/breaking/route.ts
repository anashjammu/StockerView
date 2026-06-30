import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchBreakingNews } from "@/lib/news-service";

export async function GET() {
  return NextResponse.json(successResponse(await fetchBreakingNews()));
}
