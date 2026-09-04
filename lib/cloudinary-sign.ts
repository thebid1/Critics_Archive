import { createHash } from "node:crypto";

/**
 * Cloudinary signed-upload helper (admin image uploads, Stage 7).
 *
 * The browser uploads directly to Cloudinary, but the SIGNATURE is minted here
 * server-side with the API secret — the secret is never bundled, never exposed
 * in a network payload. The signed params also CONSTRAIN what the client may
 * upload: fixed destination folder, jpg/png/webp only, hard size ceiling.
 * A client cannot dictate folder, format, or size.
 *
 * Algorithm (official docs, "Generating authentication signatures"):
 *   signature = SHA-1( alphabetical "k=v&k=v..." of ALL signed params
 *                      + api_secret )
 *   (SDK api_sign_request uses SHA-1 by default.)
 * The client must POST back every signed param with the exact same value,
 * plus api_key, file, and timestamp. Signatures are valid for one hour.
 */
export type CloudinarySignResult = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string[];
  maxFileBytes: number;
  signature: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary signing is not configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }
  return { cloudName, apiKey, apiSecret };
}

/** Fixed upload constraints the client may not override. */
export const PRODUCT_IMAGE_FOLDER = "critics-admin/product-images";
export const ALLOWED_PRODUCT_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const sortObjectKeys = (input: Record<string, unknown>): string =>
  Object.keys(input)
    .sort()
    .map((key) => `${key}=${input[key]}`)
    .join("&");

/** Build a fresh signed upload configuration for one product image. */
export function createProductImageUploadSignature(): CloudinarySignResult {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = PRODUCT_IMAGE_FOLDER;
  const formats = ALLOWED_PRODUCT_IMAGE_FORMATS.join(",");
  const maxFileBytes = MAX_PRODUCT_IMAGE_BYTES;

  const params: Record<string, unknown> = {
    timestamp,
    folder,
    allowed_formats: formats,
    max_file_size: maxFileBytes,
  };

  const signature = createHash("sha1")
    .update(`${sortObjectKeys(params)}${apiSecret}`)
    .digest("hex");

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    allowedFormats: [...ALLOWED_PRODUCT_IMAGE_FORMATS],
    maxFileBytes,
    signature,
  };
}