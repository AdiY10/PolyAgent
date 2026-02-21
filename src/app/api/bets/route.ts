import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminCookie } from "@/lib/auth";
import { BetCategory, BetStatus } from "@/generated/prisma/client";

// ─── GET /api/bets ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as BetStatus | null;
    const category = searchParams.get("category") as BetCategory | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const validStatuses = Object.values(BetStatus);
    const validCategories = Object.values(BetCategory);

    const where: Record<string, unknown> = {};
    if (status && validStatuses.includes(status)) where.status = status;
    if (category && validCategories.includes(category)) where.category = category;

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          options: {
            orderBy: { ordinal: "asc" },
            include: {
              wagers: { select: { amount: true } },
            },
          },
          _count: { select: { wagers: true } },
        },
      }),
      prisma.bet.count({ where }),
    ]);

    const formattedBets = bets.map((bet) => {
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
          wagerCount: o.wagers.length,
          oddsPercent:
            totalCoins > 0
              ? Math.round((optionCoins / totalCoins) * 100)
              : Math.round(100 / bet.options.length),
        };
      });

      return {
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
      };
    });

    return NextResponse.json({
      bets: formattedBets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/bets (admin only) ──────────────────────────────────────────────

const CreateBetSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["SPORTS", "ECONOMICS", "WEATHER", "AWARDS", "POLITICS"]),
  status: z.enum(["UPCOMING", "OPEN"]).default("UPCOMING"),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  options: z
    .array(z.string().min(1).max(100))
    .min(2, "At least 2 options required")
    .max(10, "Maximum 10 options"),
});

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminCookie(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateBetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? parsed.error.message },
        { status: 400 }
      );
    }

    const { title, description, category, status, opensAt, closesAt, options } =
      parsed.data;

    // Check for duplicate option labels
    const uniqueOptions = new Set(options.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      return NextResponse.json(
        { error: "Option labels must be unique" },
        { status: 400 }
      );
    }

    const bet = await prisma.bet.create({
      data: {
        title,
        description,
        category: category as BetCategory,
        status: status as BetStatus,
        opensAt: opensAt ? new Date(opensAt) : null,
        closesAt: closesAt ? new Date(closesAt) : null,
        options: {
          create: options.map((label, i) => ({ label, ordinal: i })),
        },
      },
      include: {
        options: { orderBy: { ordinal: "asc" } },
      },
    });

    return NextResponse.json({ bet }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
