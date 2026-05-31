import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOpenFIIsSession } from "@/lib/server-session";

export async function DELETE(_request: Request, context: { params: Promise<{ ticker: string }> }) {
  try {
    const session = await requireOpenFIIsSession();
    const { ticker } = await context.params;
    const normalizedTicker = ticker.trim().toUpperCase();

    const wallet = await prisma.wallet.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
      where: { userId: session.user.id }
    });

    if (!wallet?.id) {
      return NextResponse.json({ ok: true });
    }

    await prisma.walletPosition.deleteMany({
      where: {
        ticker: normalizedTicker,
        userId: session.user.id,
        walletId: wallet.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao excluir posicao.";
    return NextResponse.json({ error: message }, { status: message.includes("autenticado") ? 401 : 500 });
  }
}
