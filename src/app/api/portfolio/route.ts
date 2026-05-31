import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOpenFIIsSession } from "@/lib/server-session";

type BuyRequest = {
  name?: string;
  occurred_at?: string;
  quantity?: number;
  segment?: string;
  ticker?: string;
  unit_price?: number;
};

export async function GET() {
  try {
    const session = await requireOpenFIIsSession();
    const walletId = await getOrCreateDefaultWalletId(session.user.id);

    const [positions, transactions] = await Promise.all([
      prisma.walletPosition.findMany({
        include: { fii: { select: { name: true, segment: true } } },
        orderBy: { ticker: "asc" },
        where: { userId: session.user.id, walletId }
      }),
      prisma.transaction.findMany({
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        where: { userId: session.user.id, walletId }
      })
    ]);

    return NextResponse.json({
      data: {
        positions: positions.map((position) => ({
          average_price: position.averagePrice,
          fiis: position.fii,
          quantity: position.quantity,
          ticker: position.ticker
        })),
        transactions: transactions.map((transaction) => ({
          created_at: transaction.createdAt.toISOString(),
          gross_amount: transaction.grossAmount,
          id: transaction.id,
          occurred_at: formatDateOnly(transaction.occurredAt),
          quantity: transaction.quantity,
          ticker: transaction.ticker,
          type: transaction.type,
          unit_price: transaction.unitPrice
        })),
        walletId
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireOpenFIIsSession();
    const payload = await request.json() as BuyRequest;
    const ticker = payload.ticker?.trim().toUpperCase();
    const quantity = Number(payload.quantity ?? 0);
    const unitPrice = Number(payload.unit_price ?? 0);

    if (!ticker || quantity <= 0 || unitPrice <= 0) {
      return NextResponse.json({ error: "Ticker, quantidade e preco unitario sao obrigatorios." }, { status: 400 });
    }

    const walletId = await getOrCreateDefaultWalletId(session.user.id);

    await prisma.$transaction(async (tx) => {
      await tx.fii.upsert({
        create: {
          name: payload.name?.trim() || ticker,
          segment: payload.segment?.trim() || "Sem segmento",
          source: "market",
          ticker
        },
        update: {
          name: payload.name?.trim() || ticker,
          segment: payload.segment?.trim() || "Sem segmento",
          source: "market"
        },
        where: { ticker }
      });

      await tx.transaction.create({
        data: {
          grossAmount: Math.round(quantity * unitPrice * 100) / 100,
          occurredAt: parseDateOnly(payload.occurred_at),
          quantity,
          ticker,
          type: "buy",
          unitPrice,
          userId: session.user.id,
          walletId
        }
      });

      const existingPosition = await tx.walletPosition.findFirst({
        where: { ticker, userId: session.user.id, walletId }
      });

      if (!existingPosition) {
        await tx.walletPosition.create({
          data: {
            averagePrice: unitPrice,
            quantity,
            ticker,
            userId: session.user.id,
            walletId
          }
        });
        return;
      }

      const currentQuantity = Number(existingPosition.quantity);
      const currentAverage = Number(existingPosition.averagePrice);
      const nextQuantity = currentQuantity + quantity;
      const nextAverage = ((currentQuantity * currentAverage) + (quantity * unitPrice)) / nextQuantity;

      await tx.walletPosition.update({
        data: { averagePrice: nextAverage, quantity: nextQuantity },
        where: { id: existingPosition.id }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

async function getOrCreateDefaultWalletId(userId: string, name = "Carteira principal") {
  const existingWallet = await prisma.wallet.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
    where: { userId }
  });

  if (existingWallet?.id) return existingWallet.id;

  const createdWallet = await prisma.wallet.create({
    data: { name, userId },
    select: { id: true }
  });

  return createdWallet.id;
}

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha ao acessar dados da carteira.";
  const status = message.includes("autenticado") ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

function parseDateOnly(value?: string) {
  return new Date(`${value ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
