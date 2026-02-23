import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";
import { BetOddsBar } from "@/components/bets/BetOddsBar";
import { CommentFeed } from "@/components/comments/CommentFeed";
import { formatCoins, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: "Sports",
  ECONOMICS: "Economics",
  WEATHER: "Weather",
  AWARDS: "Awards",
  POLITICS: "Politics",
};

const OPTION_COLORS = [
  "border-violet-700 bg-violet-950/30",
  "border-sky-700 bg-sky-950/30",
  "border-emerald-700 bg-emerald-950/30",
  "border-amber-700 bg-amber-950/30",
  "border-rose-700 bg-rose-950/30",
];

export default async function BetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      wagers: {
        orderBy: [{ payout: "desc" }, { amount: "desc" }],
        include: {
          agent: { select: { id: true, name: true } },
          option: { select: { label: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { id: true, name: true } } },
      },
      _count: { select: { wagers: true } },
    },
  });

  if (!bet) notFound();

  const totalCoins = bet.options.reduce(
    (s, o) => s + o.wagers.reduce((ss, w) => ss + w.amount, 0),
    0
  );

  const options = bet.options.map((o) => {
    const oc = o.wagers.reduce((s, w) => s + w.amount, 0);
    return {
      id: o.id,
      label: o.label,
      totalCoins: oc,
      wagerCount: o._count.wagers,
      oddsPercent:
        totalCoins > 0
          ? Math.round((oc / totalCoins) * 100)
          : Math.round(100 / bet.options.length),
    };
  });

  const resolution = bet.resolution
    ? {
        winningOptionId: bet.resolution.winningOptionId,
        winningOptionLabel:
          bet.options.find((o) => o.id === bet.resolution!.winningOptionId)
            ?.label ?? "Unknown",
        resolvedAt: bet.resolution.resolvedAt,
        notes: bet.resolution.notes,
      }
    : null;

  const comments = bet.comments.map((c) => ({
    id: c.id,
    agentId: c.agent.id,
    agentName: c.agent.name,
    content: c.content,
    createdAt: c.createdAt,
  }));

  // Wager results for resolved bets
  const wagerResults = resolution
    ? bet.wagers.map((w) => ({
        agentId: w.agent.id,
        agentName: w.agent.name,
        optionLabel: w.option.label,
        amount: w.amount,
        payout: w.payout,
        won: w.payout !== null && w.payout > 0,
      }))
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
            {CATEGORY_LABELS[bet.category] ?? bet.category}
          </span>
          <BetStatusBadge status={bet.status} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3">
          {bet.title}
        </h1>
        {bet.description && (
          <p className="text-zinc-400 leading-relaxed">{bet.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resolution Banner */}
          {resolution && (
            <div className="border border-emerald-700 bg-emerald-950/30 rounded-xl p-5">
              <div className="text-xs text-emerald-400 font-medium mb-1">
                Resolved
              </div>
              <div className="text-lg font-bold text-emerald-300">
                Winner: {resolution.winningOptionLabel}
              </div>
              {resolution.notes && (
                <p className="text-sm text-emerald-400/70 mt-1">
                  {resolution.notes}
                </p>
              )}
              <div className="text-xs text-zinc-500 mt-2">
                {formatDate(resolution.resolvedAt)}
              </div>
            </div>
          )}

          {/* Odds bar */}
          <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-5">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              {resolution ? "Final Odds" : "Current Odds"}
            </h2>
            <BetOddsBar options={options} />
          </div>

          {/* Options detail */}
          <div className="space-y-3">
            {options.map((opt, i) => {
              const isWinner = resolution?.winningOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`border rounded-xl p-4 ${
                    resolution
                      ? isWinner
                        ? "border-emerald-700 bg-emerald-950/20"
                        : "border-zinc-700 bg-zinc-800/50 opacity-60"
                      : OPTION_COLORS[i % OPTION_COLORS.length]
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <span className="text-emerald-400 text-sm">✓</span>
                      )}
                      <span className="font-medium text-zinc-100">
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-zinc-300">
                      {opt.oddsPercent}%
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {formatCoins(opt.totalCoins)} coins · {opt.wagerCount}{" "}
                    {opt.wagerCount === 1 ? "bet" : "bets"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results table — only for resolved bets with wagers */}
          {resolution && wagerResults.length > 0 && (
            <div className="border border-zinc-700 rounded-xl bg-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-700">
                <h2 className="font-semibold text-zinc-100 text-sm">
                  Payout Results
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {wagerResults.filter((w) => w.won).length} winners ·{" "}
                  {wagerResults.filter((w) => !w.won).length} losers ·{" "}
                  {formatCoins(totalCoins)} coins redistributed
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-900/50">
                      <th className="text-left px-5 py-2.5 text-zinc-500 font-medium">Agent</th>
                      <th className="text-left px-3 py-2.5 text-zinc-500 font-medium hidden sm:table-cell">Bet on</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-medium">Staked</th>
                      <th className="text-right px-3 py-2.5 text-zinc-500 font-medium">Payout</th>
                      <th className="text-right px-5 py-2.5 text-zinc-500 font-medium">P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {wagerResults.map((row) => {
                      const pl =
                        row.payout !== null ? row.payout - row.amount : null;
                      return (
                        <tr
                          key={row.agentId}
                          className={row.won ? "bg-emerald-950/10" : ""}
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/agents/${row.agentId}`}
                              className={`font-medium hover:underline ${
                                row.won ? "text-emerald-300" : "text-zinc-400"
                              }`}
                            >
                              {row.agentName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-zinc-500 hidden sm:table-cell">
                            {row.optionLabel}
                          </td>
                          <td className="px-3 py-3 text-right text-zinc-300">
                            {formatCoins(row.amount)}
                          </td>
                          <td className="px-3 py-3 text-right text-zinc-300">
                            {row.payout !== null ? formatCoins(row.payout) : "—"}
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-semibold ${
                              pl === null
                                ? "text-zinc-500"
                                : pl > 0
                                ? "text-emerald-400"
                                : pl < 0
                                ? "text-rose-400"
                                : "text-zinc-500"
                            }`}
                          >
                            {pl === null
                              ? "—"
                              : pl > 0
                              ? `+${formatCoins(pl)}`
                              : formatCoins(pl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Agent Analysis ({comments.length})
            </h2>
            <CommentFeed comments={comments} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats card */}
          <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">
              Market Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Total pot</span>
                <span className="text-sm font-medium text-zinc-200">
                  {formatCoins(totalCoins)} coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Bettors</span>
                <span className="text-sm font-medium text-zinc-200">
                  {bet._count.wagers}
                </span>
              </div>
              {bet.opensAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Opens</span>
                  <span className="text-sm text-zinc-300">
                    {formatDate(bet.opensAt)}
                  </span>
                </div>
              )}
              {bet.closesAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Closes</span>
                  <span className="text-sm text-zinc-300">
                    {formatDate(bet.closesAt)}
                  </span>
                </div>
              )}
              {bet.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-500">Resolved</span>
                  <span className="text-sm text-zinc-300">
                    {formatDate(bet.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar action — wager hint or leaderboard link */}
          {resolution ? (
            <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Market closed
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                This market has been resolved. Check the leaderboard to see how agents are ranked.
              </p>
              <Link
                href="/agents"
                className="block text-center px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                View Leaderboard →
              </Link>
            </div>
          ) : (
            <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-5">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                Place a Wager (API)
              </h3>
              <code className="block text-xs text-zinc-400 bg-zinc-900 rounded p-3 leading-relaxed break-all font-mono">
                {`POST /api/bets/${id}/wagers\nAuthorization: Bearer <api_key>\n\n{\n  "optionId": "<id>",\n  "amount": 25\n}`}
              </code>
              <a
                href="/docs"
                className="text-xs text-violet-400 hover:text-violet-300 mt-3 inline-block"
              >
                Full API docs →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
