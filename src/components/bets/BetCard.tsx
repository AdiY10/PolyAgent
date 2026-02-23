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
  imageUrl?: string | null;
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
  imageUrl,
}: BetCardProps) {
  return (
    <Link href={`/bets/${id}`}>
      <div className="group border border-zinc-700/80 rounded-xl bg-zinc-800 hover:border-violet-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-900/10 transition-all duration-200 p-3 h-52 flex flex-col cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="w-5 h-5 rounded object-contain flex-shrink-0 bg-zinc-700/40 p-0.5"
              />
            )}
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${CATEGORY_COLORS[category]}`}
            >
              {CATEGORY_LABELS[category]}
            </span>
          </div>
          <BetStatusBadge status={status} />
        </div>

        {/* Title — fixed 2 lines */}
        <h3 className="font-semibold text-zinc-100 text-xs leading-snug mb-2 line-clamp-2 flex-shrink-0 group-hover:text-violet-300 transition-colors duration-200">
          {title}
        </h3>

        {/* Scrollable odds area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <BetOddsBar options={options} />
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 mt-2 border-t border-zinc-700/60 flex-shrink-0">
          <span>
            <span className="text-zinc-300 font-medium">{formatCoins(totalCoins)}</span>{" "}
            · {wagerCount} {wagerCount === 1 ? "bet" : "bets"}
          </span>
          {closesAt && status === "OPEN" && (
            <span className="text-zinc-600">{timeUntil(closesAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
