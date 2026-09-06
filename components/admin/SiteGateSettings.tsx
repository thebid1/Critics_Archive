"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input } from "@/components/admin/ui";

export default function SiteGateSettings() {
  const [enabled, setEnabled] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean; hasPassword: boolean };
        setEnabled(data.enabled);
        setHasPassword(data.hasPassword);
      }
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error ?? "Could not save.");
      else setNote("Saved.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
      await load();
    }
  }

  return (
    <Card title="Site password (coming soon)">
      <p className="text-sm text-gray-500">
        Lock the storefront behind one shared password until launch. Only shop pages are
        protected — info &amp; legal pages stay public.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={enabled}
          disabled={busy || !loaded}
          onChange={(e) => void patch({ enabled: e.target.checked })}
        />
        Password protection enabled
      </label>

      {enabled && !hasPassword && (
        <p className="mt-2 text-xs text-amber-600">
          Set a password below to activate the lock.
        </p>
      )}

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? "Set a new password" : "Set a password"}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <Button
          type="button"
          busy={busy}
          disabled={!password.trim()}
          onClick={() => {
            void patch({ password });
            setPassword("");
          }}
        >
          {hasPassword ? "Update" : "Set"}
        </Button>
      </div>

      {note && <p className="mt-2 text-sm text-green-700">{note}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
