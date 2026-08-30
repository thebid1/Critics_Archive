import type {
  Database,
  ProductImagesRow,
  ProductVariantsRow,
  ProductsRow,
} from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * The display shape used by ProductCard / CurrentDrop (kept stable since
 * Stage 1 so changing the data source never meant a component rewrite).
 */
export type Product = {
  slug: string;
  name: string;
  price: number; // whole display unit, e.g. NGN
  currency: string;
  isNew: boolean;
  inStock: boolean;
  image: string;
  description: string;
};

/** A purchasable size option on the product page. */
export type ProductVariant = {
  size: string;
  stock: number;
};

/** Everything the product detail page needs (gallery + sizing). */
export type ProductDetail = Product & {
  dropName: string | null;
  season: string | null;
  images: string[]; // ordered by `position` ascending
  sizes: ProductVariant[]; // all variant rows, caller decides availability
};

type ProductRowWithRelations = ProductsRow & {
  product_images?: Pick<ProductImagesRow, "url" | "position">[];
  product_variants?: Pick<ProductVariantsRow, "stock">[];
};

/** Maps a Supabase product row (+ nested images/variants) to the display shape. */
export function mapProductRow(row: ProductRowWithRelations): Product {
  const images = [...(row.product_images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
  const totalStock = (row.product_variants ?? []).reduce(
    (sum, v) => sum + (v.stock ?? 0),
    0
  );

  return {
    slug: row.slug,
    name: row.name,
    price: row.price,
    currency: row.currency,
    isNew: row.is_new,
    inStock: totalStock > 0,
    image: images[0]?.url ?? "",
    description: row.description,
  };
}

// Columns used by every catalogue listing so galleries/variants come in one roundtrip.
const LISTING_SELECT =
  "id, slug, name, price, currency, description, is_new, " +
  "product_images(url, position), product_variants(stock)";

/** Live homepage/shop listing: published, non-archived products (RLS-bound). */
export async function listPublishedProducts(limit = 50): Promise<Product[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(LISTING_SELECT)
    .eq("is_published", true)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase products query failed: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapProductRow(row as unknown as ProductRowWithRelations)
  );
}

/** One published product by slug — full detail shape for the product page. */
export async function getProductDetailBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, price, currency, description, is_new, drop_name, season, " +
        "product_images(url, position), product_variants(size, stock)"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase product query failed: ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as {
    slug: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    is_new: boolean;
    drop_name: string | null;
    season: string | null;
    product_images: { url: string; position: number }[];
    product_variants: { size: string; stock: number }[];
  };

  const base = mapProductRow(row as unknown as ProductRowWithRelations);
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);
  const sizes = (row.product_variants ?? []).map((v) => ({
    size: v.size,
    stock: v.stock ?? 0,
  }));

  return {
    ...base,
    dropName: row.drop_name,
    season: row.season,
    images: images.length > 0 ? images : base.image ? [base.image] : [],
    sizes,
  };
}

export type PageResult = {
  items: Product[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

/**
 * Paginated catalogue listing for /shop (brief: paginate once a drop exceeds 6
 * pieces — no categories). RLS-bound like the rest of the read layer.
 */
export async function listPublishedProductsPaginated({
  page = 1,
  perPage = 6,
}: { page?: number; perPage?: number } = {}): Promise<PageResult> {
  const supabase = createServerSupabase();
  // Normalize so trailing/zero/negative pages never produce invalid ranges.
  const safePage = Math.max(1, Math.floor(page));
  const safePerPage = Math.max(1, Math.floor(perPage));

  // Fetch the total first (cheap, head-only) so we can clamp the page BEFORE
  // requesting a range — PostgREST errors with "range not satisfiable" (416)
  // if the range exceeds the row count (e.g. ?page=99 on an 8-row catalogue).
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)
    .is("archived_at", null);
  if (countError) {
    throw new Error(`Supabase products count failed: ${countError.message}`);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const clampedPage = Math.min(safePage, totalPages);
  const from = (clampedPage - 1) * safePerPage;
  const to = from + safePerPage - 1;

  const { data, error } = await supabase
    .from("products")
    .select(LISTING_SELECT)
    .eq("is_published", true)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Supabase products query failed: ${error.message}`);
  }

  return {
    items: (data ?? []).map((row) =>
      mapProductRow(row as unknown as ProductRowWithRelations)
    ),
    page: clampedPage,
    perPage: safePerPage,
    total,
    totalPages,
  };
}