"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, Field, Input } from "@/components/admin/ui";
import type { AdminDrop } from "@/lib/admin/data";

export default function DropManager({ drops }: { drops: AdminDrop[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createDrop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("create");
    setError("");
    try {
      const response = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not create the drop.");
      setName("");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the drop.");
    } finally {
      setBusy(null);
    }
  }

  async function publish(dropId: string) {
    if (!window.confirm("Publish this drop? The homepage will switch to it immediately.")) return;
    setBusy(dropId);
    setError("");
    try {
      const response = await fetch(`/api/admin/drops/${dropId}/publish`, { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not publish the drop.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish the drop.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="Drops">
      <form onSubmit={createDrop} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs sm:flex-1">
          <Field label="New drop name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drop 002"
              maxLength={120}
              required
            />
          </Field>
        </div>
        <Button type="submit" busy={busy === "create"} disabled={!name.trim()} className="sm:w-auto">
          Create drop
        </Button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {drops.length === 0 ? (
        <EmptyState title="No drops yet" body="Create the first drop to get started." />
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {drops.map((drop) => (
            <li key={drop.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{drop.name}</p>
                <p className="text-xs text-gray-500">
                  Created {new Date(drop.created_at).toLocaleDateString()} ·{" "}
                  {drop.productCount} product{drop.productCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {drop.is_active ? (
                  <Badge tone="green">Live on homepage</Badge>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => publish(drop.id)} busy={busy === drop.id}>
                    Publish
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-gray-400">
        Publishing swaps the homepage instantly. Existing drops stay browsable on the shop.
      </p>
    </Card>
  );
}