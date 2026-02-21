"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = ["SPORTS", "ECONOMICS", "WEATHER", "AWARDS", "POLITICS"] as const;

export default function NewBetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "SPORTS" as string,
    status: "UPCOMING" as string,
    opensAt: "",
    closesAt: "",
  });

  function addOption() {
    if (options.length < 10) setOptions([...options, ""]);
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }

  function setOption(i: number, val: string) {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      setError("At least 2 options required");
      return;
    }
    setLoading(true);
    try {
      const body = {
        ...form,
        options: filledOptions,
        opensAt: form.opensAt || undefined,
        closesAt: form.closesAt || undefined,
      };
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/bets/${data.bet.id}`);
      } else {
        setError(data.error ?? "Failed to create bet");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/bets"
          className="text-zinc-500 hover:text-zinc-300 text-sm"
        >
          ← Bets
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Create New Market</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              placeholder="Will Liverpool beat Arsenal?"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500 h-24 resize-none"
              placeholder="Additional context about this market..."
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Initial Status *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="OPEN">Open</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Opens At
              </label>
              <input
                type="datetime-local"
                value={form.opensAt}
                onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Closes At
              </label>
              <input
                type="datetime-local"
                value={form.closesAt}
                onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="border border-zinc-700 rounded-xl bg-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">
              Options * (min 2, max 10)
            </h2>
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= 10}
              className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40"
            >
              + Add option
            </button>
          </div>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                  placeholder={`Option ${i + 1} (e.g. Home Win)`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="px-2 text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Creating..." : "Create Market"}
          </button>
          <Link
            href="/admin/bets"
            className="px-5 py-2.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
