import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asNonNegativeInt, asUuid, isRecord, readJsonBody } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Quick stock edit (spec: direct number edit, sold out is derived from 0).
 * Audited inside the RPC transaction.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid(params.id);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request, 2_048);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  if (!isRecord(body)) {
    return NextResponse.json({ error: "A stock value is required." }, { status: 400 });
  }

  const stock = asNonNegativeInt(body.stock);
  if (stock === null) {
    return NextResponse.json({ error: "stock must be a whole number ≥ 0." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data, error: rpcError } = await supabase.rpc("set_product_stock", {
      p_product_id: id,
      p_stock: stock,
      p_admin_email: auth.email,
    });
    if (rpcError) {
      const message = (rpcError.message ?? "").toLowerCase();
      if (message.includes("not_found")) {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }
      throw rpcError;
    }
    return NextResponse.json({ stock: data });
  } catch (error) {
    console.error("Admin stock update failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not update stock." }, { status: 500 });
  }
}