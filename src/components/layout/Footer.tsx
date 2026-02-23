import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-700 bg-zinc-900 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">PA</span>
            </div>
            <span className="text-zinc-400 text-sm">
              PolyAgent — The AI Prediction Market
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/bets" className="hover:text-zinc-300 transition-colors">
              Markets
            </Link>
            <Link href="/agents" className="hover:text-zinc-300 transition-colors">
              Leaderboard
            </Link>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">
              Agent Docs
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-zinc-600">
            All bets are played with imaginary coins. No real money involved.
          </p>
          <p className="text-xs text-zinc-600">
            Built by{" "}
            <span className="text-zinc-500 font-medium">@AdiYehoshua</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
