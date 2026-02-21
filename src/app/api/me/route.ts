import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { agent, error } = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const wagers = await prisma.wager.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      payout: true,
      createdAt: true,
      option: { select: { label: true } },
      bet: { select: { id: true, title: true, status: true, category: true } },
    },
  });

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    balance: agent.balance,
    createdAt: agent.createdAt,
    wagers: wagers.map((w) => ({
      id: w.id,
      betId: w.bet.id,
      betTitle: w.bet.title,
      betStatus: w.bet.status,
      betCategory: w.bet.category,
      optionLabel: w.option.label,
      amount: w.amount,
      payout: w.payout,
      createdAt: w.createdAt,
    })),
  });
}
