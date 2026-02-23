import { prisma } from "@/lib/prisma";
import { BetCard } from "@/components/bets/BetCard";
import { BetCategory, BetStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "LOCKED", label: "Locked" },
  { value: "RESOLVED", label: "Resolved" },
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "SPORTS", label: "Sports" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "WEATHER", label: "Weather" },
  { value: "AWARDS", label: "Awards" },
  { value: "POLITICS", label: "Politics" },
];

interface SearchParams {
  status?: string;
  category?: string;
}

export default async function BetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status as BetStatus | undefined;
  const categoryFilter = sp.category as BetCategory | undefined;

  const validStatuses = Object.values(BetStatus);
  const validCategories = Object.values(BetCategory);

  const where: Record<string, unknown> = {};
  if (statusFilter && validStatuses.includes(statusFilter))
    where.status = statusFilter;
  if (categoryFilter && validCategories.includes(categoryFilter))
    where.category = categoryFilter;

  const bets = await prisma.bet.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      options: {
        orderBy: { ordinal: "asc" },
        include: { wagers: { select: { amount: true } } },
      },
      _count: { select: { wagers: true } },
    },
  });

  const formattedBets = bets.map((bet) => {
    const totalCoins = bet.options.reduce(
      (s, o) => s + o.wagers.reduce((ss, w) => ss + w.amount, 0),
      0
    );
    const options = bet.options.map((o) => {
      const oc = o.wagers.reduce((s, w) => s + w.amount, 0);
      return {
        id: o.id,
        label: o.label,
        oddsPercent:
          totalCoins > 0
            ? Math.round((oc / totalCoins) * 100)
            : Math.round(100 / bet.options.length),
      };
    });
    return {
      id: bet.id,
      title: bet.title,
      category: bet.category,
      status: bet.status,
      closesAt: bet.closesAt,
      options,
      totalCoins,
      wagerCount: bet._count.wagers,
      imageUrl: bet.imageUrl,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Markets</h1>
        <p className="text-zinc-400 text-sm">
          {formattedBets.length} markets found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-1">
        {/* Status tabs */}
        <div className="flex gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-1">
          {STATUSES.map((s) => {
            const active = (sp.status ?? "") === s.value;
            const href =
              s.value
                ? `?status=${s.value}${categoryFilter ? `&category=${categoryFilter}` : ""}`
                : categoryFilter
                ? `?category=${categoryFilter}`
                : "/bets";
            return (
              <a
                key={s.value}
                href={href}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s.label}
              </a>
            );
          })}
        </div>

        {/* Category select */}
        <div className="flex gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-1">
          {CATEGORIES.map((c) => {
            const active = (sp.category ?? "") === c.value;
            const href =
              c.value
                ? `?category=${c.value}${statusFilter ? `&status=${statusFilter}` : ""}`
                : statusFilter
                ? `?status=${statusFilter}`
                : "/bets";
            return (
              <a
                key={c.value}
                href={href}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {c.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Bet Grid */}
      {formattedBets.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          No markets found for the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {formattedBets.map((bet) => (
            <BetCard key={bet.id} {...bet} />
          ))}
        </div>
      )}
    </div>
  );
}
