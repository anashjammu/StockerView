import type { NormalizedNewsArticle } from "@/lib/provider-gateway";

const MAX_AGE_MS = 30 * 86_400_000;

export type CachedNewsArticle = NormalizedNewsArticle & {
  cached: true;
  firstSeenAt: string;
  lastSeenAt: string;
  originalProvider: string;
  providersSeen: string[];
};

export async function saveRealNewsToCache(articles: NormalizedNewsArticle[], provider = "Provider") {
  if (!articles.length) return { saved: 0, totalCachedArticles: 0 };
  const cache = await readCache();
  const now = new Date().toISOString();
  const map = new Map(cache.map((article) => [cacheKey(article), article]));

  for (const article of articles) {
    const key = cacheKey(article);
    const existing = map.get(key);
    if (existing) {
      existing.lastSeenAt = now;
      existing.providersSeen = Array.from(new Set([...existing.providersSeen, provider]));
      map.set(key, { ...existing, ...article, cached: true, firstSeenAt: existing.firstSeenAt, lastSeenAt: now, originalProvider: existing.originalProvider, providersSeen: existing.providersSeen });
    } else {
      map.set(key, {
        ...article,
        cached: true,
        firstSeenAt: now,
        lastSeenAt: now,
        originalProvider: provider,
        providersSeen: [provider]
      });
    }
  }

  const pruned = pruneCache(Array.from(map.values()));
  await writeCache(pruned);
  return { saved: articles.length, totalCachedArticles: pruned.length };
}

export async function readCachedNews(range = "7d") {
  const start = rangeStart(range);
  return (await readCache()).filter((article) => new Date(article.publishedAt) >= start);
}

export async function getNewsCacheSummary(query?: string) {
  const cache = await readCache();
  const q = query?.trim().toLowerCase();
  const rows = q
    ? cache.filter((article) => `${article.title} ${article.sourceName} ${article.url} ${article.snippet}`.toLowerCase().includes(q))
    : cache;
  const sorted = [...rows].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const now = new Date();
  return {
    totalCachedArticles: cache.length,
    todayCachedArticles: cache.filter((article) => article.localDateBucket === "today").length,
    sevenDayCachedArticles: cache.filter((article) => new Date(article.publishedAt) >= new Date(now.getTime() - 7 * 86_400_000)).length,
    thirtyDayCachedArticles: cache.filter((article) => new Date(article.publishedAt) >= new Date(now.getTime() - 30 * 86_400_000)).length,
    newestCachedArticle: sorted[0]?.publishedAt ?? null,
    oldestCachedArticle: sorted.at(-1)?.publishedAt ?? null,
    sources: Array.from(new Set(rows.map((article) => article.sourceName))).sort(),
    providers: Array.from(new Set(rows.flatMap((article) => article.providersSeen))).sort(),
    sampleTitles: sorted.slice(0, 20).map((article) => ({ title: article.title, source: article.sourceName, publishedAt: article.publishedAt }))
  };
}

async function readCache(): Promise<CachedNewsArticle[]> {
  try {
    const fs = nodeFs();
    const raw = await fs.promises.readFile(cacheFile(), "utf8");
    const parsed = JSON.parse(raw);
    return pruneCache(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

async function writeCache(rows: CachedNewsArticle[]) {
  const fs = nodeFs();
  await fs.promises.mkdir(cacheDir(), { recursive: true });
  await fs.promises.writeFile(cacheFile(), JSON.stringify(rows, null, 2));
}

function pruneCache(rows: CachedNewsArticle[]) {
  const cutoff = Date.now() - MAX_AGE_MS;
  return rows.filter((article) => new Date(article.publishedAt).getTime() >= cutoff);
}

function cacheKey(article: Pick<NormalizedNewsArticle, "url" | "title" | "sourceName" | "publishedAt">) {
  return article.url ? canonicalUrl(article.url) : `${normalizeTitle(article.title)}:${article.sourceName}:${article.publishedAt}`;
}

function canonicalUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => parsed.searchParams.delete(key));
    return parsed.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function rangeStart(range: string) {
  if (range === "today") {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const days = range === "3d" ? 3 : range === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 86_400_000);
}

function nodeFs(): typeof import("fs") {
  return eval("require")("fs");
}

function nodePath(): typeof import("path") {
  return eval("require")("path");
}

function cacheDir() {
  return nodePath().join(process.cwd(), ".data");
}

function cacheFile() {
  return nodePath().join(cacheDir(), "news-cache.json");
}
