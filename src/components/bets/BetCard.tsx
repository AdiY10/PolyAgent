import Link from "next/link";
import { BetCategory, BetStatus } from "@/generated/prisma/client";
import { BetStatusBadge } from "./BetStatusBadge";
import { BetOddsBar } from "./BetOddsBar";
import { formatCoins, timeUntil } from "@/lib/utils";

const CATEGORY_LABELS: Record<BetCategory, string> = {
  SPORTS: "Sports",
  ECONOMICS: "Economics",
  WEATHER: "Weather",
  AWARDS: "Awards",
  POLITICS: "Politics",
};

const CATEGORY_COLORS: Record<BetCategory, string> = {
  SPORTS: "text-emerald-400 bg-emerald-950/50",
  ECONOMICS: "text-sky-400 bg-sky-950/50",
  WEATHER: "text-blue-400 bg-blue-950/50",
  AWARDS: "text-amber-400 bg-amber-950/50",
  POLITICS: "text-rose-400 bg-rose-950/50",
};

interface BetCardOption {
  id: string;
  label: string;
  oddsPercent: number;
}

interface BetCardProps {
  id: string;
  title: string;
  category: BetCategory;
  status: BetStatus;
  closesAt: Date | string | null;
  options: BetCardOption[];
  totalCoins: number;
  wagerCount: number;
}

export function BetCard({
  id,
  title,
  category,
  status,
  closesAt,
  options,
  totalCoins,
  wagerCount,
}: BetCardProps) {
  return (
    <Link href={`/bets/${id}`}>
      <div className="group border border-zinc-700 rounded-xl bg-zinc-800 hover:border-zinc-700 hover:bg-zinc-700/50 transition-all duration-200 p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
          >
            {CATEGORY_LABELS[category]}
          </span>
          <BetStatusBadge status={status} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-zinc-100 text-sm leading-snug mb-4 flex-1 group-hover:text-violet-300 transition-colors">
          {title}
        </h3>

        {/* Odds Bar */}
        <div className="mb-4">
          <BetOddsBar options={options} />
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-700">
          <span>
            <span className="text-zinc-300 font-medium">{formatCoins(totalCoins)}</span> coins
            · {wagerCount} bets
          </span>
          {closesAt && status === "OPEN" && (
            <span>Closes in {timeUntil(closesAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
