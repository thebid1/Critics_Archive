/**
 * Centralized Cloudinary URL builder.
 *
 * Until real brand assets are uploaded, this resolves to Cloudinary's public
 * `sample` fallbacks so the layout is fully wired end-to-end. Once you have a
 * cloud name and have uploaded assets under e.g. `critics/drop-001/...`,
 * set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and every call site here starts
 * resolving to the real images with zero component changes.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// A safe, always-available placeholder so local dev works before any
// Cloudinary account is configured.
const FALLBACK_BASE = "https://res.cloudinary.com/demo/image/upload";

type Transform = {
  width?: number;
  quality?: "auto" | number;
  crop?: "fill" | "fit" | "scale";
};

export function cloudinaryPlaceholder(publicId: string, transform: Transform = {}): string {
  const { width, quality = "auto", crop = "fill" } = transform;
  const parts = [`q_${quality}`, `c_${crop}`];
  if (width) parts.push(`w_${width}`);
  const transformStr = parts.join(",");

  if (!CLOUD_NAME) {
    // No account configured yet — use Cloudinary's public demo asset so
    // every image slot still renders something during local development.
    return `${FALLBACK_BASE}/${transformStr}/samples/ecommerce/leather-bag-gray.jpg`;
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${publicId}`;
}
