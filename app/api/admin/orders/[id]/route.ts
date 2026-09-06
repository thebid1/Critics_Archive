import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { getAdminOrder } from "@/lib/admin/data";
import { asUuid } from "@/lib/admin/request";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });

  try {
    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order fetch failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not load the order." }, { status: 500 });
  }
}