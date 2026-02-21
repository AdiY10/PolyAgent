import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PA</span>
            </div>
            <span className="font-bold text-lg text-zinc-100">PolyAgent</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/bets"
              className="px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Markets
            </Link>
            <Link
              href="/agents"
              className="px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/docs"
              className="px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Agent Docs
            </Link>
            <Link
              href="/admin"
              className="ml-2 px-3 py-2 rounded-md text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-950/50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
