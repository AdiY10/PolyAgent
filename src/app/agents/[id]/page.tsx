import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";
import { formatCoins, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      wagers: {
        orderBy: { createdAt: "desc" },
        include: {
          option: { select: { label: true } },
          bet: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!agent) notFound();

  const resolved = agent.wagers.filter((w) => w.payout !== null);
  const totalWon = resolved.filter((w) => (w.payout ?? 0) > w.amount).length;
  const totalLost = resolved.filter((w) => w.payout === 0).length;
  const totalRefunded = resolved.filter(
    (w) => w.payout !== null && w.payout === w.amount
  ).length;
  const netProfit = resolved.reduce(
    (sum, w) => sum + (w.payout ?? 0) - w.amount,
    0
  );
  const biggestWin = resolved.reduce(
    (max, w) => Math.max(max, (w.payout ?? 0) - w.amount),
    0
  );
  const decidedCount = totalWon + totalLost;
  const winRate =
    decidedCount > 0 ? Math.round((totalWon / decidedCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Agent header */}
      <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">
              {agent.name}
            </h1>
            <p className="text-zinc-500 text-sm">
              Member since {formatDate(agent.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-violet-400">
              {formatCoins(agent.balance)}
            </div>
            <div className="text-xs text-zinc-500">coins</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4 text-center">
          <div className="text-xl font-bold text-zinc-100">
            {agent.wagers.length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Total Bets</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4 text-center">
          <div className="text-xl font-bold text-emerald-400">{winRate}%</div>
          <div className="text-xs text-zinc-500 mt-1">Win Rate</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4 text-center">
          <div
            className={`text-xl font-bold ${
              netProfit > 0
                ? "text-emerald-400"
                : netProfit < 0
                ? "text-rose-400"
                : "text-zinc-400"
            }`}
          >
            {netProfit > 0 ? "+" : ""}
            {formatCoins(netProfit)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Net P/L</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4 text-center">
          <div className="text-xl font-bold text-amber-400">
            {biggestWin > 0 ? `+${formatCoins(biggestWin)}` : "—"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Biggest Win</div>
        </div>
      </div>

      {/* Bet history */}
      <div className="border border-zinc-700 rounded-xl bg-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-700">
          <h2 className="font-semibold text-zinc-100">Bet History</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {totalWon} wins · {totalLost} losses
            {totalRefunded > 0 ? ` · ${totalRefunded} refunded` : ""} ·{" "}
            {agent.wagers.length - resolved.length} pending
          </p>
        </div>
        <div className="divide-y divide-zinc-800">
          {agent.wagers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No bets placed yet.
            </div>
          ) : (
            agent.wagers.map((wager) => {
              const isWin = wager.payout !== null && wager.payout > wager.amount;
              const isLoss = wager.payout !== null && wager.payout === 0;
              const isRefund =
                wager.payout !== null && wager.payout === wager.amount;
              const isPending = wager.payout === null;
              return (
                <div key={wager.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/bets/${wager.bet.id}`}
                      className="text-sm text-zinc-200 hover:text-violet-300 transition-colors truncate block"
                    >
                      {wager.bet.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">
                        {wager.option.label}
                      </span>
                      <BetStatusBadge status={wager.bet.status} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-zinc-300">
                      {formatCoins(wager.amount)} staked
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        isPending
                          ? "text-zinc-500"
                          : isWin
                          ? "text-emerald-400"
                          : isRefund
                          ? "text-zinc-400"
                          : "text-rose-400"
                      }`}
                    >
                      {isPending
                        ? "Pending"
                        : isWin
                        ? `+${formatCoins((wager.payout ?? 0) - wager.amount)}`
                        : isRefund
                        ? "Refund"
                        : `-${formatCoins(wager.amount)}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
