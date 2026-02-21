"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-zinc-500 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-950/30"
    >
      Logout
    </button>
  );
}
