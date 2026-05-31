import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOpenFIIsSession } from "@/lib/server-session";

export async function GET(request: Request) {
  try {
    await requireOpenFIIsSession();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    const data = await prisma.fii.findMany({
      orderBy: { ticker: "asc" },
      select: {
        name: true,
        segment: true,
        source: true,
        ticker: true
      },
      take: 8,
      where: query
        ? {
          OR: [
            { ticker: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } }
          ]
        }
        : undefined
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao buscar FIIs.";
    return NextResponse.json({ error: message }, { status: message.includes("autenticado") ? 401 : 500 });
  }
}
