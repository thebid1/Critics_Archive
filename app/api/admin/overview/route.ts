import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { getAdminOverview } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  try {
    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Admin overview failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not load the dashboard." }, { status: 500 });
  }
}