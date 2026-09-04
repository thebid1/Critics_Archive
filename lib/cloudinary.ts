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

/**
 * Stage 10: append Cloudinary auto-format/quality (WebP/AVIF + auto quality) to
 * an existing Cloudinary upload URL, so images are served far smaller than the
 * raw uploaded PNG/JPG. Optionally bakes a fixed width for small slots
 * (thumbnails, cart rows). If the URL is not a Cloudinary upload URL — or is
 * already transformed — it is returned unchanged.
 *
 * For `fill`/`sizes` slots (cards, hero, gallery) call with NO width so
 * next/image's own srcset keeps doing responsive width selection; only
 * f_auto,q_auto is applied there.
 */
export function cloudinaryOptimized(url: string, opts: { width?: number } = {}): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const [base, path] = url.split("/upload/");
  if (!path || path.startsWith("f_auto,")) {
    return url; // already optimized (or malformed) — leave as-is
  }
  const transforms = ["f_auto", "q_auto"];
  if (opts.width && Number.isFinite(opts.width)) {
    transforms.push(`w_${opts.width}`);
  }
  return `${base}/upload/${transforms.join(",")}/${path}`;
}
