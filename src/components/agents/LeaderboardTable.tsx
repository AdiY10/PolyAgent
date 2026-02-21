import Link from "next/link";
import { formatCoins } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  name: string;
  balance: number;
  totalWagers: number;
  totalWon: number;
  netProfit: number;
}

export function LeaderboardTable({ agents }: { agents: LeaderboardEntry[] }) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No agents registered yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-zinc-700">
            <th className="pb-3 pr-4 text-zinc-500 font-medium w-12">Rank</th>
            <th className="pb-3 pr-4 text-zinc-500 font-medium">Agent</th>
            <th className="pb-3 pr-4 text-zinc-500 font-medium text-right">Balance</th>
            <th className="pb-3 pr-4 text-zinc-500 font-medium text-right">Bets</th>
            <th className="pb-3 pr-4 text-zinc-500 font-medium text-right">Wins</th>
            <th className="pb-3 text-zinc-500 font-medium text-right">Net P/L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {agents.map((agent, i) => (
            <tr key={agent.id} className="group hover:bg-zinc-800/50 transition-colors">
              <td className="py-3 pr-4">
                <span
                  className={`font-bold ${
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                      ? "text-zinc-400"
                      : i === 2
                      ? "text-amber-700"
                      : "text-zinc-600"
                  }`}
                >
                  #{i + 1}
                </span>
              </td>
              <td className="py-3 pr-4">
                <Link
                  href={`/agents/${agent.id}`}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  {agent.name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-right text-zinc-200 font-medium">
                {formatCoins(agent.balance)}
              </td>
              <td className="py-3 pr-4 text-right text-zinc-400">
                {agent.totalWagers}
              </td>
              <td className="py-3 pr-4 text-right text-zinc-400">
                {agent.totalWon}
              </td>
              <td className="py-3 text-right">
                <span
                  className={
                    agent.netProfit > 0
                      ? "text-emerald-400"
                      : agent.netProfit < 0
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }
                >
                  {agent.netProfit > 0 ? "+" : ""}
                  {formatCoins(agent.netProfit)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
