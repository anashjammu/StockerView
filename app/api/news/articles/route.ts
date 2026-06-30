import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchMarketArticles } from "@/lib/news-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "All";

  return NextResponse.json(successResponse(await fetchMarketArticles(filter)));
}
