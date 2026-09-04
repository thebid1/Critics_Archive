/** @type {import('next').NextConfig} */

// Only apply the strict CSP in production builds — `next dev` needs inline
// scripts/eval for Fast Refresh and would break under it.
const isProduction = process.env.NODE_ENV === "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Paystack InlineJS injects inline script, hence 'unsafe-inline'.
  "script-src 'self' 'unsafe-inline' https://js.paystack.co https://*.paystack.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.paystack.co https://*.supabase.co https://api.cloudinary.com",
  "frame-src https://checkout.paystack.com https://*.paystack.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // Narrow this to your specific cloud name once assets are uploaded, e.g.
        // pathname: "/your-cloud-name/**",
      },
    ],
  },
  async headers() {
    // Baseline hardening + full CSP (production only; see note above).
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          ...(isProduction
            ? [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
            : []),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
