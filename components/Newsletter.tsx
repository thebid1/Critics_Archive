"use client";

import { useState } from "react";

// Stage 8: wired to /api/newsletter (validation + rate limiting on the server).
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not subscribe.");
      setStatus("done");
      setEmail("");
      setMessage("You're on the list.");
    } catch (reason) {
      setStatus("error");
      setMessage(reason instanceof Error ? reason.message : "Could not subscribe.");
    }
  }

  const buttonLabel =
    status === "submitting" ? "Joining…" : status === "done" ? "Joined ✓" : "Join →";

  return (
    <section className="border-b border-hairline py-24 sm:py-32">
      <div className="container-page flex flex-col items-center text-center">
        <p className="eyebrow mb-6">Community</p>
        <h2 className="font-display text-5xl uppercase leading-[0.88] text-bone sm:text-6xl">
          Enter the
          <br />
          archive.
        </h2>
        <p className="mt-6 max-w-sm font-body text-sm text-bone-dim">
          Be first for new drops and CRITICS updates.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full border border-hairline bg-ink px-4 py-3 font-label text-sm text-bone placeholder:text-bone-dim focus:border-accent"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="whitespace-nowrap bg-bone px-6 py-3 font-label text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>
        </form>

        {message && (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`mt-4 font-label text-xs uppercase tracking-widest2 ${
              status === "error" ? "text-red-400" : "text-accent"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
