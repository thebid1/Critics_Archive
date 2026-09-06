import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { getAdminProduct } from "@/lib/admin/data";
import {
  asBoolean,
  asNonNegativeInt,
  asOptionalString,
  asString,
  asUuid,
  isRecord,
  readJsonBody,
} from "@/lib/admin/request";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IMAGES = 12;
const PATCH_KEYS = new Set([
  "name",
  "slug",
  "price",
  "currency",
  "description",
  "stock",
  "drop_id",
  "is_new",
  "is_published",
  "season",
  "archived",
  "images",
]);

function isImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  try {
    const product = await getAdminProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product fetch failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not load the product." }, { status: 500 });
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  const id = asUuid((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request, 64_000);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });
  if (!isRecord(body)) {
    return NextResponse.json({ error: "A patch object is required." }, { status: 400 });
  }

  // Whitelist keys — unknown/malformed fields are rejected, not echoed.
  for (const key of Object.keys(body)) {
    if (!PATCH_KEYS.has(key)) {
      return NextResponse.json({ error: `Unknown field: ${key}.` }, { status: 400 });
    }
  }

  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (!asString(body.name, 160)) {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }
    patch.name = body.name.trim();
  }
  if (body.slug !== undefined) {
    if (!asString(body.slug, 120) || !SLUG_RE.test(body.slug)) {
      return NextResponse.json({ error: "Slug must be letters, numbers and dashes." }, { status: 400 });
    }
    patch.slug = body.slug.trim();
  }
  if (body.price !== undefined) {
    const price = asNonNegativeInt(body.price);
    if (price === null) {
      return NextResponse.json({ error: "price must be a whole number ≥ 0." }, { status: 400 });
    }
    patch.price = price;
  }
  if (body.stock !== undefined) {
    const stock = asNonNegativeInt(body.stock);
    if (stock === null) {
      return NextResponse.json({ error: "stock must be a whole number ≥ 0." }, { status: 400 });
    }
    patch.stock = stock;
  }
  if (body.currency !== undefined) {
    if (typeof body.currency !== "string" || body.currency.length < 2 || body.currency.length > 5) {
      return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
    }
    patch.currency = body.currency;
  }
  if (body.description !== undefined) patch.description = asOptionalString(body.description, 10_000);
  if (body.season !== undefined) patch.season = asOptionalString(body.season, 40);
  if (body.drop_id !== undefined) {
    if (body.drop_id === null) patch.drop_id = null;
    else {
      const dropId = asUuid(body.drop_id);
      if (!dropId) return NextResponse.json({ error: "Invalid drop." }, { status: 400 });
      patch.drop_id = dropId;
    }
  }
  if (body.is_new !== undefined) patch.is_new = asBoolean(body.is_new);
  if (body.is_published !== undefined) patch.is_published = asBoolean(body.is_published);
  if (body.archived !== undefined) patch.archived = asBoolean(body.archived);

  if (body.images !== undefined) {
    const images = body.images;
    if (!Array.isArray(images) || images.length > MAX_IMAGES) {
      return NextResponse.json({ error: "Images must be an array of https URLs (max 12)." }, { status: 400 });
    }
    if (images.some((entry) => !isRecord(entry) || !isImageUrl(entry.url))) {
      return NextResponse.json({ error: "Images must be https URLs." }, { status: 400 });
    }
    patch.images = images.map((entry: Record<string, unknown>) => ({
      url: entry.url as string,
      alt: asOptionalString(entry.alt, 200),
    }));
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data, error: rpcError } = await supabase.rpc("update_product", {
      p_product_id: id,
      p_admin_email: auth.email,
      p_patch: patch as unknown as import("@/lib/supabase/database.types").Json,
    });
    if (rpcError) {
      const message = (rpcError.message ?? "").toLowerCase();
      if (message.includes("duplicate key")) {
        return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
      }
      if (message.includes("not_found")) {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }
      throw rpcError;
    }
    return NextResponse.json({ product: data });
  } catch (error) {
    console.error("Admin product update failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not save the product." }, { status: 500 });
  }
}