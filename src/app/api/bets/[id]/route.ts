import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminCookie } from "@/lib/auth";
import { BetCategory, BetStatus } from "@/generated/prisma/client";

// ─── GET /api/bets/:id ────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { ordinal: "asc" },
          include: {
            wagers: { select: { amount: true } },
            _count: { select: { wagers: true } },
          },
        },
        resolution: true,
        comments: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: { agent: { select: { id: true, name: true } } },
        },
        _count: { select: { wagers: true } },
      },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    const totalCoins = bet.options.reduce(
      (sum, o) => sum + o.wagers.reduce((s, w) => s + w.amount, 0),
      0
    );

    const options = bet.options.map((o) => {
      const optionCoins = o.wagers.reduce((s, w) => s + w.amount, 0);
      return {
        id: o.id,
        label: o.label,
        totalCoins: optionCoins,
        wagerCount: o._count.wagers,
        oddsPercent:
          totalCoins > 0
            ? Math.round((optionCoins / totalCoins) * 100)
            : Math.round(100 / bet.options.length),
      };
    });

    let resolution = null;
    if (bet.resolution) {
      const winningOption = bet.options.find(
        (o) => o.id === bet.resolution!.winningOptionId
      );
      resolution = {
        winningOptionId: bet.resolution.winningOptionId,
        winningOptionLabel: winningOption?.label ?? "Unknown",
        resolvedAt: bet.resolution.resolvedAt,
        notes: bet.resolution.notes,
      };
    }

    return NextResponse.json({
      id: bet.id,
      title: bet.title,
      description: bet.description,
      category: bet.category,
      status: bet.status,
      opensAt: bet.opensAt,
      closesAt: bet.closesAt,
      resolvedAt: bet.resolvedAt,
      createdAt: bet.createdAt,
      options,
      totalCoins,
      wagerCount: bet._count.wagers,
      resolution,
      recentComments: bet.comments.map((c) => ({
        id: c.id,
        agentId: c.agent.id,
        agentName: c.agent.name,
        content: c.content,
        createdAt: c.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/bets/:id (admin only) ────────────────────────────────────────

const UpdateBetSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum(["UPCOMING", "OPEN", "LOCKED", "CANCELLED"]).optional(),
  opensAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminCookie(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.bet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (existing.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Cannot modify a resolved bet" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = UpdateBetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const { status, opensAt, closesAt, ...rest } = parsed.data;

    // Handle CANCELLED status: refund all wagers
    if (status === "CANCELLED" && existing.status !== "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        const wagers = await tx.wager.findMany({ where: { betId: id } });
        for (const wager of wagers) {
          await tx.agent.update({
            where: { id: wager.agentId },
            data: { balance: { increment: wager.amount } },
          });
          await tx.wager.update({
            where: { id: wager.id },
            data: { payout: wager.amount },
          });
        }
        await tx.bet.update({
          where: { id },
          data: {
            ...rest,
            status: "CANCELLED" as BetStatus,
            opensAt: opensAt !== undefined ? (opensAt ? new Date(opensAt) : null) : undefined,
            closesAt: closesAt !== undefined ? (closesAt ? new Date(closesAt) : null) : undefined,
          },
        });
      });
      const updated = await prisma.bet.findUnique({
        where: { id },
        include: { options: { orderBy: { ordinal: "asc" } } },
      });
      return NextResponse.json({ bet: updated });
    }

    const bet = await prisma.bet.update({
      where: { id },
      data: {
        ...rest,
        ...(status ? { status: status as BetStatus } : {}),
        ...(opensAt !== undefined ? { opensAt: opensAt ? new Date(opensAt) : null } : {}),
        ...(closesAt !== undefined ? { closesAt: closesAt ? new Date(closesAt) : null } : {}),
      },
      include: { options: { orderBy: { ordinal: "asc" } } },
    });

    return NextResponse.json({ bet });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/bets/:id (admin only) ───────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminCookie(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.bet.findUnique({
      where: { id },
      include: { _count: { select: { wagers: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (existing._count.wagers > 0) {
      return NextResponse.json(
        { error: "Cannot delete a bet that has wagers. Cancel it instead." },
        { status: 400 }
      );
    }
    const betCategory = existing.category as BetCategory;
    void betCategory; // used for type safety

    await prisma.bet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
