import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchPeers } from "@/lib/ticker-service";

export async function GET(_: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  return NextResponse.json(successResponse(fetchPeers(symbol)));
}
