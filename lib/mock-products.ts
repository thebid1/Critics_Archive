export type Product = {
  slug: string;
  name: string;
  price: number; // in smallest display unit (whole currency, e.g. GBP)
  currency: string;
  isNew: boolean;
  inStock: boolean;
  image: string;
  description: string;
};

// Stage 1 mock data only. Stage 2 replaces this with a Supabase query
// against `products` / `product_images`. Keep the shape stable so the
// swap is a data-source change, not a component rewrite.
export const DROP_001: Product[] = [
  {
    slug: "black-runway-url-tee",
    name: "BLACK RUNWAY URL TEE",
    price: 50,
    currency: "GBP",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_runaway_dex53r.png",
    description:
      "Black heavyweight tee, boxy fit, runway URL graphic across the chest.",
  },
  {
    slug: "white-runway-url-tee",
    name: "WHITE RUNWAY URL TEE",
    price: 50,
    currency: "GBP",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858892/white_runaway_dzqndl.png",
    description:
      "White heavyweight tee, boxy fit, runway URL graphic across the chest.",
  },
  {
    slug: "black-swag-is-art-shorts",
    name: "BLACK SWAG IS ART SHORTS",
    price: 65,
    currency: "GBP",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/black_Swag_Short_ahw3ao.png",
    description:
      "Black relaxed-fit shorts with a tonal SWAG IS ART repeat in the waistband.",
  },
  {
    slug: "swag-is-art-hoodie-scarf",
    name: "SWAG IS ART HOODIE SCARF",
    price: 45,
    currency: "GBP",
    isNew: true,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858887/SWAG_IS_ART_-_hoodie_i6xezo.png",
    description:
      "A hoodie-detailed scarf — one statement piece with the archive wordmark woven through.",
  },
  {
    slug: "almost-gaf",
    name: "ALMOST GAF",
    price: 120,
    currency: "GBP",
    isNew: false,
    inStock: true,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858882/almost_gaf_xoexrf.png",
    description:
      "Cut-and-sew layering piece with an offset side seam and dropped panels.",
  },
  {
    slug: "crt-domain-expansion",
    name: "CRT DOMAIN EXPANSION",
    price: 110,
    currency: "GBP",
    isNew: false,
    inStock: false,
    image: "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858885/crt_domain_eqhsue.png",
    description:
      "CRT-flare graphic piece, domain-expansion print across the back, oversized cut.",
  },
];
