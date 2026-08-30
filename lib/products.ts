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
  price: number; // whole display unit, e.g. GBP
  currency: string;
  isNew: boolean;
  inStock: boolean;
  image: string;
  description: string;
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

/** One published product by slug (Stage 3 product page uses this). */
export async function getPublishedProductBySlug(
  slug: string
): Promise<Product | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(LISTING_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase product query failed: ${error.message}`);
  }

  return data ? mapProductRow(data as unknown as ProductRowWithRelations) : null;
}