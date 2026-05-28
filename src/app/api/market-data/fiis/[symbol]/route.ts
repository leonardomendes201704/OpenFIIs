import { NextResponse } from "next/server";
import { marketData } from "@/lib/market-data";

export async function GET(_request: Request, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const normalizedSymbol = symbol.toUpperCase();

  try {
    const [summary] = await marketData.brapi.getIndicators([normalizedSymbol]);

    if (!summary) {
      return NextResponse.json({ data: null, source: "brapi", warnings: [`${normalizedSymbol} não encontrado.`] }, { status: 404 });
    }

    return NextResponse.json({ data: summary, source: "brapi", warnings: [] });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        source: "brapi",
        warnings: [error instanceof Error ? error.message : "Falha ao buscar indicadores do FII."]
      },
      { status: 502 }
    );
  }
}
