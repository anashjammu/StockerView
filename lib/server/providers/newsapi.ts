import { serverEnv } from "@/lib/server/env";

export type RawNewsApiArticle = {
  title: string;
  url: string;
  sourceName: string;
  author?: string;
  publishedAt: string;
  snippet: string;
  provider: string;
};

export async function fetchNewsApiMarketNews(range: string | undefined, limit: number) {
  if (!serverEnv.newsApiKey) {
    return { articles: [] as RawNewsApiArticle[], health: { attempted: false, ok: false, returned: 0, accepted: 0, safeError: "missing_env" } };
  }

  const queries = ["stock market", "Wall Street", "S&P 500", "Nasdaq", "Dow Jones", "Federal Reserve", "inflation", "earnings", "AI stocks", "semiconductor stocks", "oil prices", "gold prices", "treasury yields"];
  const from = fromDate(range);
  const articles: RawNewsApiArticle[] = [];
  let returned = 0;

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        q: query,
        language: "en",
        sortBy: "publishedAt",
        pageSize: `${Math.min(20, limit)}`,
        from,
        apiKey: serverEnv.newsApiKey
      });
      const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, { next: { revalidate: 300 } });
      if (!response.ok) throw new Error(`http_${response.status}`);
      const json = await response.json();
      const rows = Array.isArray(json.articles) ? json.articles : [];
      returned += rows.length;
      articles.push(...rows.map(normalizeNewsApiArticle).filter(Boolean) as RawNewsApiArticle[]);
    } catch {
      // Continue other queries; provider health is aggregate below.
    }
  }

  return {
    articles,
    health: { attempted: true, ok: articles.length > 0, returned, accepted: articles.length, safeError: articles.length ? undefined : "no_usable_articles" }
  };
}

export function normalizeNewsApiArticle(raw: unknown): RawNewsApiArticle | null {
  const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const source = row.source && typeof row.source === "object" ? row.source as Record<string, unknown> : {};
  const title = stringFrom(row.title);
  const url = stringFrom(row.url);
  const publishedAt = stringFrom(row.publishedAt);
  if (!title || !url || !publishedAt) return null;
  return {
    title,
    url,
    sourceName: stringFrom(source.name) || "NewsAPI",
    author: stringFrom(row.author) || undefined,
    publishedAt,
    snippet: stringFrom(row.description),
    provider: "NewsAPI"
  };
}

function fromDate(range: string | undefined) {
  const days = range === "today" ? 1 : range === "3d" ? 3 : range === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function stringFrom(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
