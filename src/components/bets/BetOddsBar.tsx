const COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

interface Option {
  id: string;
  label: string;
  oddsPercent: number;
}

export function BetOddsBar({ options }: { options: Option[] }) {
  const total = options.reduce((s, o) => s + o.oddsPercent, 0);
  // Normalize so they sum to 100
  const normalized =
    total === 0
      ? options.map(() => Math.round(100 / options.length))
      : options.map((o) => o.oddsPercent);

  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {options.map((opt, i) => (
          <div
            key={opt.id}
            className={`${COLORS[i % COLORS.length]} transition-all duration-500`}
            style={{ width: `${normalized[i]}%` }}
            title={`${opt.label}: ${normalized[i]}%`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-1 text-xs text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`}
            />
            <span>{opt.label}</span>
            <span className="text-zinc-500">{normalized[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
