"use client";

import { useState } from "react";

// UI shell only for Stage 1. Wiring this to a real capture endpoint (with
// validation + rate limiting) happens alongside Stage 8's security pass so
// it isn't shipped half-protected.
export default function Newsletter() {
  const [status, setStatus] = useState<"idle" | "pending-backend">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending-backend");
  }

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
            placeholder="Your email"
            className="w-full border border-hairline bg-ink px-4 py-3 font-label text-sm text-bone placeholder:text-bone-dim focus:border-accent"
          />
          <button
            type="submit"
            className="whitespace-nowrap bg-bone px-6 py-3 font-label text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-accent"
          >
            {status === "idle" ? "Join →" : "Coming soon"}
          </button>
        </form>
      </div>
    </section>
  );
}
