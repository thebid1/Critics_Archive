import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { asString, isRecord, readJsonBody } from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Create a drop (not active yet). */
export async function POST(request: Request) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request, 2_048);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  if (!isRecord(body) || !asString(body.name, 120)) {
    return NextResponse.json({ error: "A drop name is required." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data, error: rpcError } = await supabase.rpc("create_drop", {
      p_name: body.name.trim(),
      p_admin_email: auth.email,
    });
    if (rpcError) throw rpcError;
    return NextResponse.json({ drop: data }, { status: 201 });
  } catch (error) {
    console.error("Admin drop create failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not create the drop." }, { status: 500 });
  }
}