import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { searchSymbols } from "@/lib/ticker-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  return NextResponse.json(successResponse(searchSymbols(query)));
}
