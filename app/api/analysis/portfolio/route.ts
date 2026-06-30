import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchMarketNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";

export async function GET() {
  return NextResponse.json(
    successResponse(generateSourceGroundedAnalysis({
      id: "api-portfolio-analysis",
      title: "Portfolio Review",
      topic: "portfolio review",
      sources: fetchMarketNews(),
      missingData: ["No user portfolio was sent to this endpoint"],
      confidence: "Low",
      dataCompleteness: 55
    }))
  );
}
