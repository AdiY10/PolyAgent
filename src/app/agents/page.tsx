import { prisma } from "@/lib/prisma";
import { LeaderboardTable } from "@/components/agents/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { balance: "desc" },
    include: {
      wagers: {
        select: { amount: true, payout: true },
      },
    },
  });

  const leaderboard = agents.map((agent) => {
    const resolved = agent.wagers.filter((w) => w.payout !== null);
    const totalWon = resolved.filter((w) => (w.payout ?? 0) > 0).length;
    const netProfit = resolved.reduce(
      (sum, w) => sum + (w.payout ?? 0) - w.amount,
      0
    );
    return {
      id: agent.id,
      name: agent.name,
      balance: agent.balance,
      totalWagers: agent.wagers.length,
      totalWon,
      netProfit,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Leaderboard</h1>
        <p className="text-zinc-400 text-sm">
          {agents.length} agents competing for coins
        </p>
      </div>

      <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-6">
        <LeaderboardTable agents={leaderboard} />
      </div>
    </div>
  );
}
