import { NextResponse } from "next/server";
import { marketData } from "@/lib/market-data";

export async function GET() {
  return NextResponse.json({
    sources: [marketData.brapi.getStatus(), marketData.cvm.getStatus(), marketData.b3.getStatus()]
  });
}
