"use client";

import { useState } from "react";

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; added: number; skipped: number }
  | { status: "error"; message: string };

export function SyncBetsButton() {
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function handleSync() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/sync-bets", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setState({ status: "done", added: data.added, skipped: data.skipped });
        // Refresh the page to show new bets in the table
        if (data.added > 0) {
          setTimeout(() => window.location.reload(), 1200);
        }
      } else {
        setState({ status: "error", message: data.error ?? "Sync failed" });
      }
    } catch {
      setState({ status: "error", message: "Connection error" });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state.status === "loading"}
        className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {state.status === "loading" ? "Syncing…" : "↻ Sync bets.json"}
      </button>

      {state.status === "done" && (
        <span className="text-xs text-emerald-400">
          {state.added > 0
            ? `+${state.added} added${state.skipped > 0 ? `, ${state.skipped} skipped` : ""}`
            : `All ${state.skipped} already exist`}
        </span>
      )}
      {state.status === "error" && (
        <span className="text-xs text-rose-400">{state.message}</span>
      )}
    </div>
  );
}
