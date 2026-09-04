"use client";

/**
 * Image upload helper — the browser talks to Cloudinary directly, but only after
 * the server mints a short-lived signature constraining folder/format/size. The
 * API secret never leaves the server; the client only receives the signed params.
 */

export type UploadedImage = { url: string; alt: string };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG and WEBP images are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "Image is larger than 8 MB.";
  }
  return null;
}

/** Upload one file → secure Cloudinary URL. Throws with a readable message. */
export async function uploadProductImage(file: File, alt: string): Promise<UploadedImage> {
  const signResponse = await fetch("/api/admin/uploads/sign", { method: "POST" });
  if (signResponse.status === 503) {
    throw new Error("Image uploads are not configured yet (Cloudinary keys).");
  }
  if (!signResponse.ok) throw new Error("Could not start the upload.");
  const signed = (await signResponse.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    allowedFormats: string[];
    maxFileBytes: number;
    signature: string;
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);
  formData.append("allowed_formats", signed.allowedFormats.join(","));
  formData.append("max_file_size", String(signed.maxFileBytes));

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  const result = (await uploadResponse.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!uploadResponse.ok || !result.secure_url) {
    throw new Error(result.error?.message ?? "Cloudinary rejected the image.");
  }
  return { url: result.secure_url, alt };
}