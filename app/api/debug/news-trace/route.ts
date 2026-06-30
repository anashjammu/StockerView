import { NextResponse } from "next/server";
import { providerCacheHeaders, traceMissingMarketNews } from "@/lib/provider-gateway";

export async function GET() {
  const trace = await traceMissingMarketNews();

  return NextResponse.json(
    {
      data: trace,
      source: "Internal news trace",
      status: "delayed",
      delay: "Provider-dependent",
      updatedAt: new Date().toISOString()
    },
    { headers: providerCacheHeaders }
  );
}
