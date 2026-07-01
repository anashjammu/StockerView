import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealMarketNews, getTickerIdentity, matchArticleToTicker, providerCacheHeaders, type NormalizedNewsArticle } from "@/lib/provider-gateway";
import { getRangeStart } from "@/lib/news-classification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const range = normalizeRange(url.searchParams.get("range"));
  const timezone = url.searchParams.get("timezone") || "America/Los_Angeles";
  const query = (url.searchParams.get("q") ?? url.searchParams.get("query") ?? "").trim();
  const page = positiveInt(url.searchParams.get("page"), 1);
  const pageSize = allowedPageSize(url.searchParams.get("pageSize") ?? url.searchParams.get("limit"));
  const payload = await fetchRealMarketNews({
    range,
    limit: 100,
    timezone
  });
  const rows = payload.data ?? [];
  const categoryRows = category && category !== "All"
    ? rows.filter((article) => article.primaryCategory === category || article.categories.includes(category))
    : rows;
  const { rows: searchedRows, searchMode, ticker } = await filterByQuery(categoryRows, query);
  const paginated = paginate(searchedRows, page, pageSize);
  const meta = buildNewsMeta({
    articles: paginated.rows,
    allFilteredRows: searchedRows,
    source: payload.source,
    range,
    timezone,
    query,
    ticker,
    searchMode,
    page: paginated.page,
    pageSize: paginated.pageSize,
    totalItems: searchedRows.length,
    debugMeta: payload.meta
  });

  return NextResponse.json(
    {
      ...successResponse(paginated.rows, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      meta,
      error: payload.error
    },
    { headers: providerCacheHeaders }
  );
}

async function filterByQuery(rows: NormalizedNewsArticle[], query: string) {
  if (!query) return { rows, searchMode: "none", ticker: null as string | null };
  const normalized = query.toUpperCase();
  if (/^[A-Z.]{1,6}$/.test(normalized)) {
    const identity = await getTickerIdentity(normalized);
    return {
      rows: rows.filter((article) => matchArticleToTicker(article, identity).matched),
      searchMode: "ticker",
      ticker: identity.normalizedSymbol
    };
  }
  const lower = query.toLowerCase();
  return {
    rows: rows.filter((article) => `${article.title} ${article.snippet} ${article.sourceName} ${article.primaryCategory}`.toLowerCase().includes(lower)),
    searchMode: "text",
    ticker: null as string | null
  };
}

function buildNewsMeta({
  articles,
  allFilteredRows,
  source,
  range,
  timezone,
  query,
  ticker,
  searchMode,
  page,
  pageSize,
  totalItems,
  debugMeta
}: {
  articles: NormalizedNewsArticle[];
  allFilteredRows: NormalizedNewsArticle[];
  source: string;
  range: string;
  timezone: string;
  query: string;
  ticker: string | null;
  searchMode: string;
  page: number;
  pageSize: number;
  totalItems: number;
  debugMeta?: Awaited<ReturnType<typeof fetchRealMarketNews>>["meta"];
}) {
  const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const now = new Date();
  const rangeStart = getRangeStart(range, timezone);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const timestampWarnings = allFilteredRows.filter((article) => {
    const publishedTime = new Date(article.publishedAt).getTime();
    return article.timestampWarning || article.timestampValid === false || !Number.isFinite(publishedTime) || publishedTime > now.getTime() + 5 * 60 * 1000;
  });
  return {
    range,
    timezone,
    todayStartLocal: getRangeStart("today", timezone).toISOString(),
    rangeStartUtc: rangeStart.toISOString(),
    rangeEndUtc: now.toISOString(),
    nowLocal: new Intl.DateTimeFormat("en-US", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" }).format(now),
    nowUtc: now.toISOString(),
    query,
    ticker,
    searchMode,
    limit: pageSize,
    totalArticles: articles.length,
    totalBeforeRangeFilter: debugMeta?.totalArticlesBeforeFiltering ?? allFilteredRows.length,
    totalAfterRangeFilter: debugMeta?.totalArticlesAfterFiltering ?? allFilteredRows.length,
    totalBeforeTickerFilter: debugMeta?.totalArticlesAfterMerge ?? allFilteredRows.length,
    totalAfterTickerFilter: allFilteredRows.length,
    totalBeforePagination: totalItems,
    totalAfterPagination: articles.length,
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
    sourceCounts: countBy(allFilteredRows.map((article) => article.sourceName)),
    categoryCounts: countBy(allFilteredRows.flatMap((article) => article.categories.length ? article.categories : [article.primaryCategory])),
    bucketCounts: countBy(allFilteredRows.map((article) => article.localDateBucket)),
    timestampWarningsCount: timestampWarnings.length,
    timestampWarningSamples: timestampWarnings.slice(0, 5).map((article) => ({ title: article.title, source: article.sourceName, publishedAt: article.publishedAt, warning: article.timestampWarning ?? "future_or_invalid_timestamp" })),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
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

function normalizeRange(value: string | null) {
  return value?.toLowerCase() === "today" ? "today" : "7d";
}

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function allowedPageSize(value: string | null) {
  const parsed = positiveInt(value, 25);
  return [25, 50, 100].includes(parsed) ? parsed : 25;
}

function paginate<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), page: safePage, pageSize };
}
