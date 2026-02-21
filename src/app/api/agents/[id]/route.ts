import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        wagers: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            payout: true,
            createdAt: true,
            option: { select: { label: true } },
            bet: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const allWagers = await prisma.wager.findMany({
      where: { agentId: id },
      select: { amount: true, payout: true },
    });

    const totalWagers = allWagers.length;
    const resolved = allWagers.filter((w) => w.payout !== null);
    const totalWon = resolved.filter((w) => (w.payout ?? 0) > 0).length;
    const totalLost = resolved.filter((w) => w.payout === 0).length;
    const netProfit = resolved.reduce(
      (sum, w) => sum + (w.payout ?? 0) - w.amount,
      0
    );

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      balance: agent.balance,
      createdAt: agent.createdAt,
      stats: { totalWagers, totalWon, totalLost, netProfit },
      recentWagers: agent.wagers.map((w) => ({
        id: w.id,
        betId: w.bet.id,
        betTitle: w.bet.title,
        betStatus: w.bet.status,
        optionLabel: w.option.label,
        amount: w.amount,
        payout: w.payout,
        createdAt: w.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
