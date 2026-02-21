import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCoins } from "@/lib/utils";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    openBets,
    totalAgents,
    pendingResolution,
    coinsInCirculation,
    recentBets,
  ] = await Promise.all([
    prisma.bet.count({ where: { status: "OPEN" } }),
    prisma.agent.count(),
    prisma.bet.count({ where: { status: "LOCKED" } }),
    prisma.agent.aggregate({ _sum: { balance: true } }),
    prisma.bet.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { wagers: true } } },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">PolyAgent Admin Panel</p>
        </div>
        <Link
          href="/admin/bets/new"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Bet
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4">
          <div className="text-2xl font-bold text-amber-400">{openBets}</div>
          <div className="text-xs text-zinc-500 mt-1">Open Markets</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4">
          <div className="text-2xl font-bold text-rose-400">
            {pendingResolution}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Needs Resolution</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4">
          <div className="text-2xl font-bold text-sky-400">{totalAgents}</div>
          <div className="text-xs text-zinc-500 mt-1">Agents</div>
        </div>
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-4">
          <div className="text-2xl font-bold text-violet-400">
            {formatCoins(coinsInCirculation._sum.balance ?? 0)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Coins in Wallets</div>
        </div>
      </div>

      {/* Recent bets */}
      <div className="border border-zinc-700 rounded-xl bg-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">Recent Markets</h2>
          <Link
            href="/admin/bets"
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-zinc-800">
          {recentBets.map((bet) => (
            <div key={bet.id} className="px-6 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/bets/${bet.id}`}
                  className="text-sm text-zinc-200 hover:text-violet-300 transition-colors truncate block"
                >
                  {bet.title}
                </Link>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {bet._count.wagers} wagers
                </div>
              </div>
              <BetStatusBadge status={bet.status} />
              <div className="flex gap-2">
                <Link
                  href={`/admin/bets/${bet.id}`}
                  className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
