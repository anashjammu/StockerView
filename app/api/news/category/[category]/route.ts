import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";
import { fetchNewsByCategory } from "@/lib/research-engine";

export async function GET(_request: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return NextResponse.json(successResponse(fetchNewsByCategory(decodeURIComponent(category))));
}
