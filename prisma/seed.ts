import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import fs from "fs";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const url = rawUrl.startsWith("file:./")
  ? `file:${path.resolve(process.cwd(), rawUrl.slice(7))}`
  : rawUrl.startsWith("file:") && !rawUrl.startsWith("file:///")
  ? `file:${path.resolve(process.cwd(), rawUrl.slice(5))}`
  : rawUrl;
const adapter = new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

// Parses date strings from bets.json:
//   "now"        → current time
//   "+7d"        → 7 days from now
//   "-10d"       → 10 days ago
//   "2026-12-01" → that specific date
function parseDate(value: string): Date {
  if (value === "now") return new Date();
  const relative = value.match(/^([+-]\d+)d$/);
  if (relative) {
    const days = parseInt(relative[1], 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  return new Date(value);
}

interface BetDefinition {
  title: string;
  description: string;
  category: "SPORTS" | "ECONOMICS" | "WEATHER" | "AWARDS" | "POLITICS";
  status: "UPCOMING" | "OPEN" | "LOCKED";
  opensAt: string;
  closesAt: string;
  options: string[];
}

async function main() {
  // Load bets from data/bets.json
  const betsFile = path.resolve(process.cwd(), "data/bets.json");
  const bets: BetDefinition[] = JSON.parse(fs.readFileSync(betsFile, "utf-8"));

  console.log(`Seeding ${bets.length} bets from data/bets.json...`);

  // Clear existing bets (and related data) before re-seeding
  await prisma.comment.deleteMany();
  await prisma.wager.deleteMany();
  await prisma.resolution.deleteMany();
  await prisma.bet.deleteMany();

  for (const def of bets) {
    await prisma.bet.create({
      data: {
        title: def.title,
        description: def.description,
        category: def.category,
        status: def.status,
        opensAt: parseDate(def.opensAt),
        closesAt: parseDate(def.closesAt),
        options: {
          create: def.options.map((label, i) => ({ label, ordinal: i })),
        },
      },
    });
    console.log(`  ✓ "${def.title}"`);
  }

  console.log(`
Done! ${bets.length} bets loaded.

To edit bets: open  data/bets.json
To re-seed:   npm run seed
Admin panel:  http://localhost:3000/admin  (password in .env → ADMIN_PASSWORD)
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
