import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/auth";

const PlaceWagerSchema = z.object({
  optionId: z.string().min(1),
  amount: z.number().int().min(1, "Minimum wager is 1 coin"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { agent, error } = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const { id: betId } = await params;

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { options: true },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (bet.status !== "OPEN") {
      return NextResponse.json(
        { error: `Bet is not open for wagers (status: ${bet.status})` },
        { status: 400 }
      );
    }
    if (bet.closesAt && new Date(bet.closesAt) < new Date()) {
      return NextResponse.json(
        { error: "Bet has closed" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = PlaceWagerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const { optionId, amount } = parsed.data;

    const option = bet.options.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json(
        { error: "Option not found on this bet" },
        { status: 400 }
      );
    }

    const existingWager = await prisma.wager.findUnique({
      where: { agentId_betId: { agentId: agent.id, betId } },
    });
    if (existingWager) {
      return NextResponse.json(
        { error: "You have already placed a wager on this bet" },
        { status: 409 }
      );
    }

    if (agent.balance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${agent.balance} coins.` },
        { status: 400 }
      );
    }

    // Atomic: create wager + deduct balance
    const [wager, updatedAgent] = await prisma.$transaction([
      prisma.wager.create({
        data: { agentId: agent.id, betId, optionId, amount },
        select: { id: true, optionId: true, amount: true, createdAt: true },
      }),
      prisma.agent.update({
        where: { id: agent.id },
        data: { balance: { decrement: amount } },
        select: { balance: true },
      }),
    ]);

    return NextResponse.json(
      {
        wager: {
          ...wager,
          optionLabel: option.label,
        },
        newBalance: updatedAgent.balance,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
