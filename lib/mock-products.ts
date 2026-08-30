import type { Product } from "@/lib/products";

// Stage 1 mock data — now a dev/outage FALLBACK only. The homepage renders from
// Supabase via lib/products.ts when the DB is reachable. Keep in sync with supabase/seed.sql.
// Currency is NGN (naira) — Paystack's home currency.
export const DROP_001: Product[] = [
  {
    slug: "black-runway-url-tee",
    name: "BLACK RUNWAY URL TEE",
    price: 25000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/Black_Runaway_Tee_pxs9fw.png",
    description:
      "Black heavyweight tee, boxy fit, runway URL graphic across the chest.",
  },
  {
    slug: "white-runway-url-tee",
    name: "WHITE RUNWAY URL TEE",
    price: 25000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/White_Runaway_Tee_ku1lsz.png",
    description:
      "White heavyweight tee, boxy fit, runway URL graphic across the chest.",
  },
  {
    slug: "black-swag-is-art-shorts",
    name: "BLACK SWAG IS ART SHORTS",
    price: 25000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_Swag_Short_ahw3ao.png",
    description:
      "Black relaxed-fit shorts with a tonal SWAG IS ART repeat in the waistband.",
  },
  {
    slug: "swag-is-art-hoodie-scarf",
    name: "SWAG IS ART HOODIE SCARF",
    price: 20000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/SWAG_IS_ART_-_hoodie_i6xezo.png",
    description:
      "A hoodie-detailed scarf — one statement piece with the archive wordmark woven through.",
  },
  {
    slug: "crt-domain-expansion-white-tee",
    name: "CRT DOMAIN EXPANSION WHITE TEE",
    price: 25000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858885/crt_domain_eqhsue.png",
    description:
      "CRT-flare graphic tee, domain-expansion print across the back, oversized cut.",
  },
  {
    slug: "crt-domain-expansion-black-tee",
    name: "CRT DOMAIN EXPANSION BLACK TEE",
    price: 25000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1788066779/CRT_Domain_Expansion_Black_Tee_y7fruy.png",
    description:
      "Swag is Art tee with a tonal repeat of the archive wordmark woven through.",
  },
  {
    slug: "sia-hoodie",
    name: "SIA - HOODIE",
    price: 35000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1788066155/SIA_Hoodie_abjlpm.png",
    description:
      "CRITICS hoodie with a tonal repeat of the archive wordmark woven through.",
  },
  {
    slug: "sia-sweatpants",
    name: "SIA - SWEATPANTS",
    price: 30000,
    currency: "NGN",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1788066154/SIA_Sweatpant_ue13go.png",
    description:
      "Swag is Art sweatpants with a tonal repeat of the archive wordmark woven through.",
  },
];
