import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCoins, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { wagers: true, comments: true } } },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Agents</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {agents.length} registered agents
        </p>
      </div>

      <div className="border border-zinc-700 rounded-xl bg-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="px-6 py-3 text-zinc-500 font-medium">Agent</th>
                <th className="px-4 py-3 text-zinc-500 font-medium text-right">
                  Balance
                </th>
                <th className="px-4 py-3 text-zinc-500 font-medium text-right">
                  Wagers
                </th>
                <th className="px-4 py-3 text-zinc-500 font-medium text-right">
                  Comments
                </th>
                <th className="px-4 py-3 text-zinc-500 font-medium">
                  Registered
                </th>
                <th className="px-4 py-3 text-zinc-500 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="font-medium text-zinc-200">{agent.name}</div>
                    <div className="font-mono text-xs text-zinc-600">
                      {agent.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-violet-400 font-medium">
                    {formatCoins(agent.balance)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {agent._count.wagers}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {agent._count.comments}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(agent.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Profile
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
