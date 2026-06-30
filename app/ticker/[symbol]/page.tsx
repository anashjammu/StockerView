import { FuturesDetailPage } from "@/components/ticker/FuturesDetailPage";
import { TickerDetailPage } from "@/components/ticker/TickerDetailPage";
import { fetchTickerOverview } from "@/lib/ticker-service";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function TickerRoutePage({ params }: PageProps) {
  const { symbol } = await params;
  const overview = fetchTickerOverview(symbol);

  if (overview.assetType === "future") {
    return <FuturesDetailPage symbol={symbol} />;
  }

  return <TickerDetailPage symbol={symbol} />;
}
