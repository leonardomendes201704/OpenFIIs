import { NextResponse } from "next/server";
import { marketData } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const limit = Number(searchParams.get("limit") ?? 200);

  try {
    const data = await marketData.cvm.getMonthlyReports(year);
    return NextResponse.json({ data: data.slice(0, limit), source: "cvm", total: data.length, warnings: [] });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        source: "cvm",
        warnings: [error instanceof Error ? error.message : "Falha ao buscar informes mensais da CVM."]
      },
      { status: 502 }
    );
  }
}
