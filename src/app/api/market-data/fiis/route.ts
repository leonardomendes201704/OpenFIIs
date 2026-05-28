import { NextResponse } from "next/server";
import { marketData, type FiiSummary } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const warnings: string[] = [];

  try {
    const data = await marketData.brapi.listFiis(query);
    return NextResponse.json({ data, source: "brapi", warnings });
  } catch (error) {
    warnings.push(formatWarning("brapi", error));
  }

  try {
    const data = await marketData.b3.listListedFiis();
    const filtered = filterFiis(data, query);
    return NextResponse.json({ data: filtered, source: "b3", warnings });
  } catch (error) {
    warnings.push(formatWarning("b3", error));
  }

  return NextResponse.json(
    {
      data: [],
      source: null,
      warnings: [...warnings, "Nenhuma fonte de listagem de FIIs respondeu com sucesso."]
    },
    { status: 502 }
  );
}

function filterFiis(data: FiiSummary[], query?: string) {
  if (!query) return data;

  const normalized = query.toLowerCase();
  return data.filter((fii) => {
    return fii.symbol.toLowerCase().includes(normalized) || fii.name?.toLowerCase().includes(normalized);
  });
}

function formatWarning(source: string, error: unknown) {
  return `${source}: ${error instanceof Error ? error.message : "falha desconhecida"}`;
}
