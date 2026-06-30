export type RssSourceConfig = {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
};

export type RssProviderHealth = {
  source: string;
  attempted: boolean;
  ok: boolean;
  returned: number;
  accepted: number;
  safeError?: string;
};

export type RawRssArticle = {
  title: string;
  url: string;
  sourceName: string;
  author?: string;
  publishedAt: string;
  snippet: string;
  category: string;
  provider: string;
};

export function getMarketRssSources(): RssSourceConfig[] {
  return [
    { id: "cnbc-markets", name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "Market", enabled: true },
    { id: "seeking-alpha-market", name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml", category: "Market", enabled: true },
    { id: "reinsurance-ws", name: "reinsurance.ws", url: "https://www.reinsurance.ws/feed/", category: "Finance", enabled: true },
    { id: "marketwatch-top", name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "Market", enabled: true },
    { id: "sec-press", name: "SEC", url: "https://www.sec.gov/news/pressreleases.rss", category: "Finance", enabled: true },
    { id: "federal-reserve", name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "Fed", enabled: true }
  ];
}

export async function fetchRssMarketNews(range: string | undefined, limit: number) {
  const sources = getMarketRssSources().filter((source) => source.enabled);
  const articles: RawRssArticle[] = [];
  const health: RssProviderHealth[] = [];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "MarketPulse/1.0" },
        next: { revalidate: 300 }
      });
      if (!response.ok) throw new Error(`http_${response.status}`);
      const xml = await response.text();
      const rows = parseRssItems(xml, source).slice(0, limit);
      articles.push(...rows);
      health.push({ source: source.name, attempted: true, ok: true, returned: rows.length, accepted: rows.length });
    } catch (error) {
      health.push({ source: source.name, attempted: true, ok: false, returned: 0, accepted: 0, safeError: safeError(error) });
    }
  }

  return { articles, health, range };
}

export function normalizeRssArticle(raw: RawRssArticle, sourceConfig?: RssSourceConfig) {
  return {
    ...raw,
    sourceName: raw.sourceName || sourceConfig?.name || "RSS",
    category: raw.category || sourceConfig?.category || "Market"
  };
}

function parseRssItems(xml: string, source: RssSourceConfig): RawRssArticle[] {
  return Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => {
    const item = match[0];
    const title = decodeXmlText(readXmlField(item, "title"));
    const url = decodeXmlText(readXmlField(item, "link") || readXmlField(item, "guid"));
    const pubDate = decodeXmlText(readXmlField(item, "pubDate") || readXmlField(item, "published") || readXmlField(item, "updated"));
    const parsedDate = pubDate ? new Date(pubDate) : null;
    return {
      title,
      url,
      sourceName: source.name,
      author: decodeXmlText(readXmlField(item, "author") || readXmlField(item, "dc:creator")) || undefined,
      publishedAt: parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : "",
      snippet: decodeXmlText(stripHtml(readXmlField(item, "description") || readXmlField(item, "content:encoded"))),
      category: source.category,
      provider: "RSS"
    };
  }).filter((article) => article.title && article.url && article.publishedAt);
}

function readXmlField(xml: string, field: string) {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escapedField}[^>]*>([\\s\\S]*?)<\\/${escapedField}>`, "i"));
  return match?.[1]?.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim() ?? "";
}

function decodeXmlText(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 80) : "request_failed";
}
