import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchMacroNews, fetchMarketNews, generateSourceGroundedAnalysis } from "@/lib/research-engine";

export async function GET() {
  return NextResponse.json(
    successResponse(generateSourceGroundedAnalysis({
      id: "api-market-brief",
      title: "Market Brief",
      topic: "market brief",
      sources: [...fetchMarketNews(), ...fetchMacroNews()],
      missingData: ["Real API data not connected yet"],
      confidence: "Medium",
      dataCompleteness: 78
    }))
  );
}
