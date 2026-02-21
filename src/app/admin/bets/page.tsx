import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";
import { formatCoins, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBetsPage() {
  const bets = await prisma.bet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: { select: { label: true, ordinal: true }, orderBy: { ordinal: "asc" } },
      _count: { select: { wagers: true } },
      resolution: { select: { winningOptionId: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">All Markets</h1>
          <p className="text-zinc-400 text-sm mt-1">{bets.length} markets total</p>
        </div>
        <Link
          href="/admin/bets/new"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Bet
        </Link>
      </div>

      <div className="border border-zinc-700 rounded-xl bg-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="px-6 py-3 text-zinc-500 font-medium">Title</th>
                <th className="px-4 py-3 text-zinc-500 font-medium">Category</th>
                <th className="px-4 py-3 text-zinc-500 font-medium">Status</th>
                <th className="px-4 py-3 text-zinc-500 font-medium text-right">Wagers</th>
                <th className="px-4 py-3 text-zinc-500 font-medium">Closes</th>
                <th className="px-4 py-3 text-zinc-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bets.map((bet) => (
                <tr key={bet.id} className="hover:bg-zinc-700/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-zinc-200 max-w-xs truncate">
                      {bet.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {bet.options.map((o) => o.label).join(" / ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {bet.category}
                  </td>
                  <td className="px-4 py-3">
                    <BetStatusBadge status={bet.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300">
                    {bet._count.wagers}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {bet.closesAt ? formatDate(bet.closesAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bets/${bet.id}`}
                      className="text-xs text-violet-400 hover:text-violet-300 mr-3"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/bets/${bet.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
