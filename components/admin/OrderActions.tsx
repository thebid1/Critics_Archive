"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/admin/ui";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending payment",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function OrderActions({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: string;
  status: string;
  trackingNumber?: string;
}) {
  const router = useRouter();
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function run(action: string, endpoint: string, body?: unknown) {
    setBusy(action);
    setError("");
    setNote("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The request failed.");
      setNote(actionNote(action));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {note && (
        <p className="text-sm text-green-700" role="status">
          {note}
        </p>
      )}

      {status === "paid" && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-900">Mark fulfilled</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Tracking number (optional)"
              maxLength={200}
            />
            <Button
              type="button"
              busy={busy === "fulfill"}
              onClick={() =>
                run("fulfill", `/api/admin/orders/${orderId}/status`, {
                  status: "fulfilled",
                  tracking_number: tracking,
                })
              }
            >
              Fulfill & notify customer
            </Button>
          </div>
        </div>
      )}

      {status === "fulfilled" && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Fulfilled</p>
          <p className="mt-1">
            {trackingNumber
              ? `Tracking: ${trackingNumber}`
              : "No tracking number on file."}
          </p>
        </div>
      )}

      {status === "pending" && (
        <Button
          type="button"
          variant="danger"
          busy={busy === "cancel"}
          onClick={() => {
            if (!window.confirm("Cancel this order? Reserved stock will be released.")) return;
            void run("cancel", `/api/admin/orders/${orderId}/status`, { status: "cancelled" });
          }}
        >
          Cancel order
        </Button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          busy={busy === "resend-confirmation"}
          onClick={() => run("resend-confirmation", `/api/admin/orders/${orderId}/resend-confirmation`)}
        >
          Resend confirmation email
        </Button>
        {status === "fulfilled" && (
          <Button
            type="button"
            variant="secondary"
            busy={busy === "resend-shipped"}
            onClick={() => run("resend-shipped", `/api/admin/orders/${orderId}/resend-shipped`, { tracking_number: tracking })}
          >
            Resend shipped email
          </Button>
        )}
      </div>
    </div>
  );
}

function actionNote(action: string): string {
  switch (action) {
    case "fulfill":
      return "Order marked fulfilled — shipped email sent to the customer.";
    case "cancel":
      return "Order cancelled and stock released.";
    case "resend-confirmation":
      return "Confirmation email re-sent.";
    case "resend-shipped":
      return "Shipped email re-sent.";
    default:
      return "Done.";
  }
}

export { STATUS_LABELS };