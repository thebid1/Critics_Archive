import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asUuid } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Publish a drop: atomic swap inside publish_drop — unsets whatever was active,
 * activates this drop, records the audit row in the same transaction.
 * Instant-only (no scheduling — flagged as an open client question).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid drop id." }, { status: 400 });

  try {
    const supabase = createAdminSupabase();
    const { data, error: rpcError } = await supabase.rpc("publish_drop", {
      p_drop_id: id,
      p_admin_email: auth.email,
    });
    if (rpcError) {
      const message = (rpcError.message ?? "").toLowerCase();
      if (message.includes("not_found")) {
        return NextResponse.json({ error: "Drop not found." }, { status: 404 });
      }
      throw rpcError;
    }
    return NextResponse.json({ drop: data });
  } catch (error) {
    console.error("Admin drop publish failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not publish the drop." }, { status: 500 });
  }
}