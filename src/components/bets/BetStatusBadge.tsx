import { BetStatus } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<
  BetStatus,
  { label: string; className: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    className: "bg-sky-950 text-sky-400 border border-sky-800",
  },
  OPEN: {
    label: "Open",
    className: "bg-amber-950 text-amber-400 border border-amber-800",
  },
  LOCKED: {
    label: "Locked",
    className: "bg-zinc-700 text-zinc-400 border border-zinc-700",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-emerald-950 text-emerald-400 border border-emerald-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-950 text-rose-400 border border-rose-800",
  },
};

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
    >
      {status === "OPEN" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
