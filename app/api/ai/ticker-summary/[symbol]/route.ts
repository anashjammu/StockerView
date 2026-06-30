import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { serverEnv } from "@/lib/server/env";

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  if (!serverEnv.aiFeaturesEnabled || !serverEnv.openaiApiKey) {
    return NextResponse.json(
      successResponse(null, {
        source: `AI disabled for ${decodeURIComponent(symbol).trim().toUpperCase()}`,
        status: "unavailable",
        delay: "N/A"
      })
    );
  }

  return NextResponse.json(
    successResponse(null, {
      source: "AI provider not connected",
      status: "unavailable",
      delay: "N/A"
    })
  );
}
