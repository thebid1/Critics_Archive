import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { listAdminProducts } from "@/lib/admin/data";
import {
  asBoolean,
  asNonNegativeInt,
  asOptionalString,
  asString,
  isRecord,
  readJsonBody,
  asUuid,
} from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SIZE_CHARTS = new Set(["tee", "short", "hoodie", "sweatpants", "scarf"]);
const MAX_IMAGES = 12;

function isImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const includeArchived = url.searchParams.get("archived") === "1";

  try {
    const products = await listAdminProducts({
      q: q.slice(0, 120),
      includeArchived,
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Admin products list failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request, 64_000);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });

  if (!isRecord(body) || !asString(body.name, 160) || !asString(body.slug, 120)) {
    return NextResponse.json({ error: "name and slug are required." }, { status: 400 });
  }
  if (!SLUG_RE.test(body.slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and dashes." }, { status: 400 });
  }
  const price = asNonNegativeInt(body.price);
  const stock = asNonNegativeInt(body.stock);
  if (price === null || stock === null) {
    return NextResponse.json({ error: "price and stock must be whole numbers ≥ 0." }, { status: 400 });
  }
  if (typeof body.currency === "string" && (body.currency.length < 2 || body.currency.length > 5)) {
    return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
  }
  const sizeChart = typeof body.size_chart === "string" ? body.size_chart : "";
  if (!SIZE_CHARTS.has(sizeChart)) {
    return NextResponse.json(
      { error: "size_chart must be one of: tee, short, hoodie, sweatpants, scarf." },
      { status: 400 }
    );
  }
  const dropId = body.drop_id ? asUuid(body.drop_id) : null;
  if (body.drop_id && !dropId) {
    return NextResponse.json({ error: "Invalid drop." }, { status: 400 });
  }

  const rawImages = Array.isArray(body.images) ? body.images : [];
  if (rawImages.length > MAX_IMAGES) {
    return NextResponse.json({ error: "At most 12 images per product." }, { status: 400 });
  }
  if (rawImages.some((entry) => !isRecord(entry) || !isImageUrl(entry.url))) {
    return NextResponse.json({ error: "Images must be https URLs." }, { status: 400 });
  }
  const images = rawImages.map((entry: Record<string, unknown>) => ({
    url: entry.url as string,
    alt: asOptionalString(entry.alt, 200),
  }));

  const data: Record<string, unknown> = {
    name: body.name.trim(),
    slug: body.slug.trim(),
    price,
    currency: asOptionalString(body.currency, 5) || "NGN",
    description: asOptionalString(body.description, 10_000),
    stock,
    drop_id: dropId,
    is_new: asBoolean(body.is_new),
    is_published: asBoolean(body.is_published),
    season: asOptionalString(body.season, 40),
    size_chart: sizeChart,
    images: images.filter((img) => img.url !== ""),
  };

  try {
    const supabase = createAdminSupabase();
    const { data: created, error: rpcError } = await supabase.rpc("create_product", {
      p_admin_email: auth.email,
      p_data: data as unknown as import("@/lib/supabase/database.types").Json,
    });
    if (rpcError) {
      const message = (rpcError.message ?? "").toLowerCase();
      if (message.includes("duplicate key")) {
        return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
      }
      throw rpcError;
    }
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Admin product create failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not create the product." }, { status: 500 });
  }
}