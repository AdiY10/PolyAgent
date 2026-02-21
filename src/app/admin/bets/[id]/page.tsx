"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const STATUSES = ["UPCOMING", "OPEN", "LOCKED", "CANCELLED"] as const;

interface Option {
  id: string;
  label: string;
  totalCoins: number;
  wagerCount: number;
  oddsPercent: number;
}

interface BetData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  options: Option[];
  totalCoins: number;
  wagerCount: number;
  resolution: {
    winningOptionId: string;
    winningOptionLabel: string;
    notes: string | null;
  } | null;
}

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

function toIso(local: string) {
  if (!local) return undefined;
  return new Date(local).toISOString();
}

export default function AdminBetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [bet, setBet] = useState<BetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [winningOptionId, setWinningOptionId] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "",
    opensAt: "",
    closesAt: "",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/bets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBet(data);
        setForm({
          title: data.title,
          description: data.description ?? "",
          status: data.status,
          opensAt: toLocalDatetime(data.opensAt),
          closesAt: toLocalDatetime(data.closesAt),
        });
        if (data.options?.[0]) setWinningOptionId(data.options[0].id);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/bets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          status: form.status,
          opensAt: toIso(form.opensAt),
          closesAt: toIso(form.closesAt),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBet((prev) => prev ? { ...prev, ...data.bet, options: prev.options } : prev);
        setError("Saved!");
        setTimeout(() => setError(""), 2000);
      } else {
        setError(data.error ?? "Failed to save");
      }
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!winningOptionId) return;
    setResolving(true);
    setResolveError("");
    try {
      const res = await fetch(`/api/bets/${params.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningOptionId, notes: resolveNotes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin/bets");
      } else {
        setResolveError(data.error ?? "Failed to resolve");
      }
    } catch {
      setResolveError("Connection error");
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm">Loading...</div>;
  }
  if (!bet) {
    return <div className="text-rose-400">Bet not found.</div>;
  }

  const isResolved = bet.status === "RESOLVED";
  const isCancelled = bet.status === "CANCELLED";
  const canResolve = !isResolved && !isCancelled;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bets" className="text-zinc-500 hover:text-zinc-300 text-sm">
          ← Bets
        </Link>
        <h1 className="text-xl font-bold text-zinc-100 truncate flex-1">
          {bet.title}
        </h1>
        <Link
          href={`/bets/${bet.id}`}
          target="_blank"
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          View public ↗
        </Link>
      </div>

      {/* Resolution banner */}
      {bet.resolution && (
        <div className="border border-emerald-700 bg-emerald-950/20 rounded-xl p-4 mb-6">
          <div className="text-xs text-emerald-400 font-medium mb-1">Resolved</div>
          <div className="font-semibold text-emerald-300">
            Winner: {bet.resolution.winningOptionLabel}
          </div>
          {bet.resolution.notes && (
            <p className="text-xs text-emerald-400/70 mt-1">{bet.resolution.notes}</p>
          )}
        </div>
      )}

      {/* Market stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-zinc-700 rounded-lg bg-zinc-800 p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{bet.totalCoins}</div>
          <div className="text-xs text-zinc-500">Total Coins</div>
        </div>
        <div className="border border-zinc-700 rounded-lg bg-zinc-800 p-3 text-center">
          <div className="text-xl font-bold text-sky-400">{bet.wagerCount}</div>
          <div className="text-xs text-zinc-500">Wagers</div>
        </div>
        <div className="border border-zinc-700 rounded-lg bg-zinc-800 p-3 text-center">
          <div className="text-xl font-bold text-zinc-300">{bet.options.length}</div>
          <div className="text-xs text-zinc-500">Options</div>
        </div>
      </div>

      {/* Options breakdown */}
      <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-5 mb-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Options</h2>
        <div className="space-y-2">
          {bet.options.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">{opt.label}</span>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{opt.wagerCount} bets</span>
                <span>{opt.totalCoins} coins</span>
                <span className="text-zinc-400 font-medium">{opt.oddsPercent}%</span>
                <span className="font-mono text-zinc-600 text-xs select-all">{opt.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {!isResolved && (
        <form
          onSubmit={handleSave}
          className="border border-zinc-700 rounded-xl bg-zinc-800 p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Edit Market</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Opens At</label>
                <input
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Closes At</label>
                <input
                  type="datetime-local"
                  value={form.closesAt}
                  onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
          {error && (
            <div
              className={`mt-4 text-xs px-3 py-2 rounded-lg ${
                error === "Saved!"
                  ? "text-emerald-400 bg-emerald-950/30 border border-emerald-800"
                  : "text-rose-400 bg-rose-950/30 border border-rose-800"
              }`}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-100 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Resolve form */}
      {canResolve && bet.wagerCount > 0 && (
        <form
          onSubmit={handleResolve}
          className="border border-violet-800 bg-violet-950/20 rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-violet-300 mb-5">
            Resolve Market
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Winning Option
              </label>
              <select
                value={winningOptionId}
                onChange={(e) => setWinningOptionId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              >
                {bet.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} ({opt.wagerCount} bets, {opt.totalCoins} coins)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Admin Notes (optional)
              </label>
              <input
                type="text"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="e.g. Confirmed by official result"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          {resolveError && (
            <div className="mt-4 text-xs text-rose-400 bg-rose-950/30 border border-rose-800 rounded-lg px-3 py-2">
              {resolveError}
            </div>
          )}
          <button
            type="submit"
            disabled={resolving}
            className="mt-4 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {resolving ? "Resolving & paying out..." : "Resolve & Distribute Payouts"}
          </button>
        </form>
      )}

      {canResolve && bet.wagerCount === 0 && (
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-6 text-center text-zinc-500 text-sm">
          No wagers placed yet. Resolve will be available once agents participate.
        </div>
      )}
    </div>
  );
}
