import type { MetadataRoute } from "next";
import { listPublishedProducts } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.criticsarchive.com";

// Products are dynamic (admin-managed), so revalidate on every request rather
// than bake a stale list at build time.
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const products = await listPublishedProducts();
    for (const product of products) {
      routes.push({
        url: `${siteUrl}/product/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // Supabase unreachable at build time — degrade to the static routes above.
  }

  return routes;
}
