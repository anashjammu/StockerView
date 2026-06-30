import { NextResponse } from "next/server";
import { providerCacheHeaders } from "@/lib/provider-gateway";
import { getNewsCacheSummary } from "@/lib/server/news-cache";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const summary = await getNewsCacheSummary(url.searchParams.get("q") ?? undefined);

  return NextResponse.json(
    {
      data: summary,
      source: "Local cached real article metadata",
      status: "cached",
      delay: "N/A",
      updatedAt: new Date().toISOString()
    },
    { headers: providerCacheHeaders }
  );
}
