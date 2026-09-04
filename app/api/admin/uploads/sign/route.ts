import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin/guard";
import { createProductImageUploadSignature } from "@/lib/cloudinary-sign";

export const dynamic = "force-dynamic";

/**
 * Returns a FRESH, short-lived signed upload config for ONE product image.
 *
 * The signature is generated server-side with the Cloudinary API secret and
 * constrains folder/format/size — the browser never sees the secret and cannot
 * influence what it uploads or where it lands.
 */
export async function POST() {
  const auth = await requireAdminRequest();
  if (!auth.ok) return auth.response;

  try {
    const signed = createProductImageUploadSignature();
    return NextResponse.json(signed);
  } catch (error) {
    console.error("Cloudinary signing failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Image uploads are not configured on this environment." },
      { status: 503 }
    );
  }
}