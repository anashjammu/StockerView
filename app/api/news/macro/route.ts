import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealMarketNews, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = await fetchRealMarketNews({
    range: url.searchParams.get("range") ?? "7d",
    limit: Number(url.searchParams.get("limit") ?? 30),
    query: "Federal Reserve inflation treasury yields economy"
  });
  const macroTerms = ["fed", "federal reserve", "inflation", "treasury", "yield", "economy", "jobs", "cpi", "pce", "rates"];
  const filtered = (payload.data ?? []).filter((article) => {
    const text = `${article.headline} ${article.snippet} ${article.category}`.toLowerCase();
    return macroTerms.some((term) => text.includes(term));
  });

  return NextResponse.json(
    {
      ...successResponse(filtered.length ? filtered : payload.data, {
        source: payload.source,
        status: payload.status,
        delay: payload.delay,
        updatedAt: payload.updatedAt
      }),
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}
