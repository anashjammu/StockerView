import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealMarketNews, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const payload = await fetchRealMarketNews({
    range: url.searchParams.get("range") ?? "7d",
    limit
  });
  const rows = payload.data ?? [];
  const filteredRows = category && category !== "All"
    ? rows.filter((article) => article.primaryCategory === category || article.categories.includes(category))
    : rows;
  const meta = buildNewsMeta(filteredRows, payload.source, url.searchParams.get("range") ?? "7d", limit, payload.meta);

  return NextResponse.json(
    {
      ...successResponse(filteredRows, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      meta,
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}

function buildNewsMeta(articles: NonNullable<Awaited<ReturnType<typeof fetchRealMarketNews>>["data"]>, source: string, range: string, limit: number, debugMeta?: Awaited<ReturnType<typeof fetchRealMarketNews>>["meta"]) {
  const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return {
    range,
    limit,
    timezone: "America/Los_Angeles",
    totalArticles: articles.length,
    liveProviderArticleCount: debugMeta?.liveProviderArticleCount ?? articles.length,
    cachedArticleCount: debugMeta?.cachedArticleCount ?? 0,
    totalArticlesBeforeFiltering: debugMeta?.totalArticlesBeforeFiltering ?? articles.length,
    totalArticlesAfterFiltering: debugMeta?.totalArticlesAfterFiltering ?? articles.length,
    totalArticlesAfterMerge: debugMeta?.totalArticlesAfterMerge ?? articles.length,
    providersUsed: source === "Unavailable" ? [] : source.split(" + "),
    providerHealth: debugMeta?.providerHealth ?? {},
    providerCounts: debugMeta?.providerCounts ?? {},
    rssSourceHealth: debugMeta?.rssSourceHealth ?? [],
    acceptedCounts: debugMeta?.acceptedCounts ?? {},
    rejectedCounts: debugMeta?.rejectedCounts ?? {},
    rejectedReasons: debugMeta?.rejectedReasons ?? {},
    firstRejectedArticles: debugMeta?.firstRejectedArticles ?? [],
    dedupedCount: debugMeta?.dedupedCount ?? 0,
    categoryCounts: debugMeta?.categoryCounts ?? countBy(articles.flatMap((article) => article.categories.length ? article.categories : [article.primaryCategory])),
    bucketCounts: debugMeta?.bucketCounts ?? countBy(articles.map((article) => article.localDateBucket)),
    newestArticleAt: debugMeta?.newestArticleAt ?? sorted[0]?.publishedAt ?? null,
    oldestArticleAt: debugMeta?.oldestArticleAt ?? sorted.at(-1)?.publishedAt ?? null,
    cacheUsed: debugMeta?.cacheUsed ?? false
  };
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
