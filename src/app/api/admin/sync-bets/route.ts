import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyAdminCookie } from "@/lib/auth";

interface BetDefinition {
  title: string;
  description?: string;
  category: "SPORTS" | "ECONOMICS" | "WEATHER" | "AWARDS" | "POLITICS";
  status: "UPCOMING" | "OPEN" | "LOCKED";
  opensAt?: string;
  closesAt?: string;
  options: string[];
  imageUrl?: string | null;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value === "now") return new Date();
  const relative = value.match(/^([+-]\d+)d$/);
  if (relative) {
    const days = parseInt(relative[1], 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  return new Date(value);
}

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminCookie(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const betsFile = path.join(process.cwd(), "data", "bets.json");
    const defs: BetDefinition[] = JSON.parse(fs.readFileSync(betsFile, "utf-8"));

    let added = 0;
    let skipped = 0;

    for (const def of defs) {
      const existing = await prisma.bet.findFirst({ where: { title: def.title } });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.bet.create({
        data: {
          title: def.title,
          description: def.description ?? null,
          imageUrl: def.imageUrl ?? null,
          category: def.category,
          status: def.status,
          opensAt: parseDate(def.opensAt) ?? null,
          closesAt: parseDate(def.closesAt) ?? null,
          options: {
            create: def.options.map((label, i) => ({ label, ordinal: i })),
          },
        },
      });
      added++;
    }

    return NextResponse.json({ added, skipped, total: defs.length });
  } catch (err) {
    console.error("sync-bets error:", err);
    return NextResponse.json({ error: "Failed to sync bets" }, { status: 500 });
  }
}
