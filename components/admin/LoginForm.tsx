"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/admin/ui";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setErrorMessage(result.error ?? "Could not send the sign-in link.");
        return;
      }
      setMessage(
        result.message ??
          "If your email is authorized, a sign-in link is on its way — check your inbox."
      );
    } catch {
      setErrorMessage("Could not reach the server. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-gray-900">Admin sign in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter an authorized email and we’ll send a magic link.
      </p>

      {(error === "unauthorized" || error === "auth" || error === "session") && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error === "unauthorized"
            ? "That account is not on the admin allow-list."
            : "The sign-in link was invalid or expired. Try again."}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email address">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {errorMessage && (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        <Button type="submit" disabled={!email.trim()} busy={busy} className="w-full">
          Send sign-in link
        </Button>
      </form>
    </div>
  );
}