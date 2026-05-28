import { NextResponse } from "next/server";
import { marketData } from "@/lib/market-data";

export async function GET(_request: Request, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;

  try {
    const data = await marketData.brapi.getHistorical(symbol.toUpperCase());
    return NextResponse.json({ data, source: "brapi", warnings: [] });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        source: "brapi",
        warnings: [error instanceof Error ? error.message : "Falha ao buscar histórico do FII."]
      },
      { status: 502 }
    );
  }
}
