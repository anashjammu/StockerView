import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchTickerNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const normalized = decodeURIComponent(symbol).trim().toUpperCase();

  return NextResponse.json(
    successResponse(generateSourceGroundedAnalysis({
      id: `api-analysis-${normalized}`,
      title: `${normalized} Ticker Review`,
      topic: `${normalized} ticker research`,
      sources: fetchTickerNews(normalized),
      missingData: ["Real API data not connected yet"],
      confidence: "Low",
      dataCompleteness: 60
    }))
  );
}
