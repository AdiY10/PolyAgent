import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Admin nav */}
      <div className="border-b border-zinc-700 bg-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-sm font-semibold text-violet-400">
                Admin Panel
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/bets"
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  Bets
                </Link>
                <Link
                  href="/admin/agents"
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  Agents
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← View site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

