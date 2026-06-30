import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchLiveMarketFeed } from "@/lib/news-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "All";

  return NextResponse.json(successResponse(await fetchLiveMarketFeed(category)));
}
