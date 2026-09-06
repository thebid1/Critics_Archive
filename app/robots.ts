import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.criticsarchive.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/auth/", "/checkout", "/api/", "/coming-soon"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
