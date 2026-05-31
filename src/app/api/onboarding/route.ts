import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOpenFIIsSession } from "@/lib/server-session";

type OnboardingRequest = {
  full_name?: string;
  investor_profile?: string;
  monthly_income_goal?: number;
  positions?: Array<{
    average_price: number;
    name?: string;
    quantity: number;
    segment?: string;
    ticker: string;
  }>;
  skipped?: boolean;
  wallet_name?: string;
};

export async function GET() {
  try {
    const session = await requireOpenFIIsSession();
    const profile = await prisma.profile.findUnique({
      select: {
        fullName: true,
        investorProfile: true,
        monthlyIncomeGoal: true,
        onboardingCompletedAt: true,
        onboardingSkippedAt: true
      },
      where: { id: session.user.id }
    });

    return NextResponse.json({
      data: {
        profile: profile ? {
          full_name: profile.fullName,
          investor_profile: profile.investorProfile,
          monthly_income_goal: profile.monthlyIncomeGoal,
          onboarding_completed_at: profile.onboardingCompletedAt?.toISOString() ?? null,
          onboarding_skipped_at: profile.onboardingSkippedAt?.toISOString() ?? null
        } : null,
        user: {
          email: session.user.email,
          id: session.user.id,
          name: session.user.name
        }
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireOpenFIIsSession();
    const payload = await request.json() as OnboardingRequest;
    const walletId = await getOrCreateDefaultWalletId(session.user.id, payload.wallet_name);

    await prisma.$transaction(async (tx) => {
      await tx.wallet.updateMany({
        data: { name: payload.wallet_name?.trim() || "Carteira principal" },
        where: { id: walletId, userId: session.user.id }
      });

      if (!payload.skipped) {
        for (const position of payload.positions ?? []) {
          const ticker = position.ticker.trim().toUpperCase();
          const quantity = Number(position.quantity ?? 0);
          const unitPrice = Number(position.average_price ?? 0);

          if (!ticker || quantity <= 0 || unitPrice <= 0) continue;

          await tx.fii.upsert({
            create: {
              name: position.name?.trim() || ticker,
              segment: position.segment?.trim() || "Sem segmento",
              source: "market",
              ticker
            },
            update: {
              name: position.name?.trim() || ticker,
              segment: position.segment?.trim() || "Sem segmento",
              source: "market"
            },
            where: { ticker }
          });

          await tx.transaction.create({
            data: {
              grossAmount: Math.round(quantity * unitPrice * 100) / 100,
              occurredAt: new Date(),
              quantity,
              ticker,
              type: "buy",
              unitPrice,
              userId: session.user.id,
              walletId
            }
          });

          await tx.walletPosition.upsert({
            create: {
              averagePrice: unitPrice,
              quantity,
              ticker,
              userId: session.user.id,
              walletId
            },
            update: {
              averagePrice: unitPrice,
              quantity
            },
            where: {
              walletId_ticker: { ticker, walletId }
            }
          });
        }
      }

      await tx.profile.upsert({
        create: {
          fullName: payload.full_name?.trim() || session.user.name,
          id: session.user.id,
          investorProfile: payload.investor_profile || "moderado",
          monthlyIncomeGoal: Number(payload.monthly_income_goal ?? 0),
          onboardingCompletedAt: payload.skipped ? null : new Date(),
          onboardingSkippedAt: payload.skipped ? new Date() : null
        },
        update: {
          fullName: payload.full_name?.trim() || session.user.name,
          investorProfile: payload.investor_profile || "moderado",
          monthlyIncomeGoal: Number(payload.monthly_income_goal ?? 0),
          onboardingCompletedAt: payload.skipped ? null : new Date(),
          onboardingSkippedAt: payload.skipped ? new Date() : null
        },
        where: { id: session.user.id }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

async function getOrCreateDefaultWalletId(userId: string, walletName?: string) {
  const existingWallet = await prisma.wallet.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
    where: { userId }
  });

  if (existingWallet?.id) return existingWallet.id;

  const createdWallet = await prisma.wallet.create({
    data: { name: walletName?.trim() || "Carteira principal", userId },
    select: { id: true }
  });

  return createdWallet.id;
}

function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha ao processar onboarding.";
  return NextResponse.json({ error: message }, { status: message.includes("autenticado") ? 401 : 500 });
}
