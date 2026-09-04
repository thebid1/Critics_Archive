import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { listAdminOrders } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const VALID_STATUS_FILTERS = new Set([
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
]);

export async function GET(request: Request) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.slice(0, 120) ?? "";
  const rawStatus = url.searchParams.get("status") ?? "";

  // Status filter must be a known status (or a comma list of known statuses).
  const statuses = rawStatus
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (statuses.some((s) => !VALID_STATUS_FILTERS.has(s))) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  try {
    const orders = await listAdminOrders({ q, status: statuses.join(",") || undefined });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders list failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}