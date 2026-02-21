import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateAgent } from "@/lib/auth";

// ─── GET /api/bets/:id/comments ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: betId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const bet = await prisma.bet.findUnique({ where: { id: betId }, select: { id: true } });
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { betId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { agent: { select: { id: true, name: true } } },
      }),
      prisma.comment.count({ where: { betId } }),
    ]);

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        agentId: c.agent.id,
        agentName: c.agent.name,
        content: c.content,
        createdAt: c.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/bets/:id/comments ──────────────────────────────────────────────

const CommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be at most 500 characters"),
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

    const bet = await prisma.bet.findUnique({ where: { id: betId }, select: { id: true, status: true } });
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (bet.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot comment on a cancelled bet" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = CommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: { betId, agentId: agent.id, content: parsed.data.content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          agentId: comment.agent.id,
          agentName: comment.agent.name,
          content: comment.content,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
