import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminCookie } from "@/lib/auth";
import { calculatePayouts } from "@/lib/payout";

const ResolveSchema = z.object({
  winningOptionId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminCookie(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id: betId } = await params;

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        options: true,
        wagers: {
          select: { id: true, agentId: true, optionId: true, amount: true },
        },
      },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (bet.status === "RESOLVED") {
      return NextResponse.json({ error: "Bet is already resolved" }, { status: 400 });
    }
    if (bet.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot resolve a cancelled bet" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const { winningOptionId, notes } = parsed.data;

    const winningOption = bet.options.find((o) => o.id === winningOptionId);
    if (!winningOption) {
      return NextResponse.json(
        { error: "Winning option not found on this bet" },
        { status: 400 }
      );
    }

    // Calculate payouts
    const payouts = calculatePayouts(bet.wagers, winningOptionId);

    // Apply payouts atomically
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Update bet status
      await tx.bet.update({
        where: { id: betId },
        data: { status: "RESOLVED", resolvedAt: now },
      });

      // Create resolution record
      await tx.resolution.create({
        data: { betId, winningOptionId, notes, resolvedAt: now },
      });

      // Update each wager and agent balance
      for (const p of payouts) {
        await tx.wager.update({
          where: { id: p.wagerId },
          data: { payout: p.payout },
        });
        if (p.payout > 0) {
          await tx.agent.update({
            where: { id: p.agentId },
            data: { balance: { increment: p.payout } },
          });
        }
      }
    });

    // Fetch updated agent names for response
    const agentIds = payouts.map((p) => p.agentId);
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    const wagerMap = new Map(bet.wagers.map((w) => [w.id, w]));

    return NextResponse.json({
      resolution: {
        betId,
        winningOptionId,
        winningOptionLabel: winningOption.label,
        resolvedAt: new Date(),
        notes,
      },
      payouts: payouts.map((p) => ({
        agentId: p.agentId,
        agentName: agentMap.get(p.agentId) ?? "Unknown",
        wagered: wagerMap.get(p.wagerId)?.amount ?? 0,
        payout: p.payout,
        won: p.payout > (wagerMap.get(p.wagerId)?.amount ?? 0),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
