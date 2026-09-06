"use client";

import { useState } from "react";

export default function ComingSoonGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/site-gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Navigate to the page they were originally headed to (or home). A full
        // navigation re-runs middleware, which now sees the valid cookie and
        // lets them in — reloading /coming-soon would just show the form again.
        const next = new URLSearchParams(window.location.search).get("next");
        const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
        window.location.assign(target);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Wrong password.");
        setBusy(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-bone">
      <div className="w-full max-w-sm text-center">
        <p className="font-script text-4xl text-bone">Critics Archive</p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none text-bone">
          Coming soon
        </h1>
        <p className="mt-3 font-label text-xs uppercase tracking-widest2 text-bone-dim">
          Swag is art
        </p>

        <form onSubmit={submit} className="mt-10">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            aria-label="Password"
            autoComplete="off"
            className="w-full border border-hairline bg-transparent px-4 py-3 text-center font-body text-sm text-bone placeholder:text-bone-dim focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !password}
            className="mt-4 w-full bg-accent px-4 py-3 font-label text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
          {error && <p className="mt-3 font-body text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
