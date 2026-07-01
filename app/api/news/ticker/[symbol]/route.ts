import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchRealTickerNews, providerCacheHeaders } from "@/lib/provider-gateway";

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const url = new URL(request.url);
  const page = positiveInt(url.searchParams.get("page"), 1);
  const pageSize = allowedPageSize(url.searchParams.get("pageSize") ?? url.searchParams.get("limit"));
  const payload = await fetchRealTickerNews(decodeURIComponent(symbol).trim().toUpperCase(), {
    range: url.searchParams.get("range") ?? "7d",
    limit: 100,
    timezone: url.searchParams.get("timezone") ?? undefined
  });
  const rows = payload.data ?? [];
  const paginated = paginate(rows, page, pageSize);
  return NextResponse.json(
    {
      ...successResponse(paginated.rows, { source: payload.source, status: payload.status, delay: payload.delay, updatedAt: payload.updatedAt }),
      error: payload.error,
      meta: {
        ...(payload.meta ?? {}),
        symbol: decodeURIComponent(symbol).trim().toUpperCase(),
        totalFetched: payload.meta?.totalFetched ?? rows.length,
        totalAfterTickerFilter: rows.length,
        rejectedAsUnrelatedCount: payload.meta?.rejectedAsUnrelatedCount ?? 0,
        rejectedIncidentalMentionCount: payload.meta?.rejectedIncidentalMentionCount ?? 0,
        rejectedProviderTagWithoutTopicRelevanceCount: payload.meta?.rejectedProviderTagWithoutTopicRelevanceCount ?? 0,
        rejectedTitleAboutOtherCompanyCount: payload.meta?.rejectedTitleAboutOtherCompanyCount ?? 0,
        rejectedSnippetOnlyUnrelatedTitleCount: payload.meta?.rejectedSnippetOnlyUnrelatedTitleCount ?? 0,
        rejectedWeakMatchBelowThresholdCount: payload.meta?.rejectedWeakMatchBelowThresholdCount ?? 0,
        providerCounts: payload.meta?.providerCounts ?? {},
        acceptedSamples: payload.meta?.acceptedSamples ?? [],
        rejectedSamples: payload.meta?.rejectedSamples ?? [],
        pagination: {
          page: paginated.page,
          pageSize: paginated.pageSize,
          totalItems: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / paginated.pageSize)),
          hasNextPage: paginated.page < Math.max(1, Math.ceil(rows.length / paginated.pageSize)),
          hasPreviousPage: paginated.page > 1
        }
      }
    },
    { headers: providerCacheHeaders }
  );
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
