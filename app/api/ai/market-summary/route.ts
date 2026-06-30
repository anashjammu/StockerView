import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { serverEnv } from "@/lib/server/env";

export async function GET() {
  if (!serverEnv.aiFeaturesEnabled || !serverEnv.openaiApiKey) {
    return NextResponse.json(
      successResponse(null, {
        source: "AI disabled",
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
