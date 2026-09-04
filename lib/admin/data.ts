import { createAdminSupabase } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

/**
 * Admin (service-role) read helpers for the /admin screens.
 *
 * These are SERVER-ONLY: they are called from admin page server components and
 * admin route handlers — never from client components, and every caller guards
 * with requireAdmin()/requireAdminRequest() first.
 */

// --- Products ---------------------------------------------------------------

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  stock: number;
  drop_id: string | null;
  drop_name: string | null;
  season: string | null;
  is_new: boolean;
  is_published: boolean;
  archived_at: string | null;
  size_chart: string;
  created_at: string;
  updated_at: string;
  images: { id: string; url: string; alt: string; position: number }[];
  sizes: { size: string }[];
};

const PRODUCT_SELECT =
  "id, slug, name, price, currency, description, stock, drop_id, season, is_new, is_published, archived_at, size_chart, created_at, updated_at, " +
  "drops(name), product_images(id, url, alt, position), product_variants(size)";

type ProductRowLike = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  stock: number;
  drop_id: string | null;
  season: string | null;
  is_new: boolean;
  is_published: boolean;
  archived_at: string | null;
  size_chart: string;
  created_at: string;
  updated_at: string;
  drops?: { name: string } | null;
  product_images?: { id: string; url: string; alt: string; position: number }[] | null;
  product_variants?: { size: string }[] | null;
};

function mapProductRow(row: ProductRowLike): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    currency: row.currency,
    description: row.description,
    stock: row.stock,
    drop_id: row.drop_id,
    drop_name: row.drops?.name ?? null,
    season: row.season,
    is_new: row.is_new,
    is_published: row.is_published,
    archived_at: row.archived_at,
    size_chart: row.size_chart,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: [...(row.product_images ?? [])].sort((a, b) => a.position - b.position),
    sizes: row.product_variants ?? [],
  };
}

// Strip characters that PostgREST's `.or()` parser would misread.
function sanitizeSearch(value: string): string {
  return value.trim().replace(/[%,()]/g, "");
}

export async function listAdminProducts(options: {
  q?: string;
  includeArchived?: boolean;
} = {}): Promise<AdminProduct[]> {
  const supabase = createAdminSupabase();
  const query = supabase.from("products").select(PRODUCT_SELECT);

  if (!options.includeArchived) query.is("archived_at", null);
  if (options.q?.trim()) {
    const needle = `%${sanitizeSearch(options.q)}%`;
    query.or(`name.ilike.${needle},slug.ilike.${needle}`);
  }

  query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new Error(`Admin products list failed: ${error.message}`);
  return (data ?? []).map((row) => mapProductRow(row as unknown as ProductRowLike));
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Admin product fetch failed: ${error.message}`);
  if (!data) return null;
  return mapProductRow(data as unknown as ProductRowLike);
}

// --- Orders -----------------------------------------------------------------

export type AdminOrderItem = {
  id: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  image: string;
};

export type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  email: string;
  phone: string;
  customer_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency: string;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  tracking_number: string;
  shipped_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  items: AdminOrderItem[];
};

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  email: string;
  phone: string;
  customer_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency: string;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  tracking_number: string;
  shipped_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: AdminOrderItem[] | null;
};

function mapOrderRow(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    email: row.email,
    phone: row.phone,
    customer_name: row.customer_name,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    city: row.city,
    country: row.country,
    subtotal: row.subtotal,
    shipping_total: row.shipping_total,
    total: row.total,
    currency: row.currency,
    paid_at: row.paid_at,
    confirmation_email_sent_at: row.confirmation_email_sent_at,
    tracking_number: row.tracking_number,
    shipped_email_sent_at: row.shipped_email_sent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: row.order_items ?? [],
  };
}

const ORDER_LIST_SELECT =
  "id, reference, status, email, customer_name, city, country, total, currency, created_at, paid_at, confirmation_email_sent_at, shipped_email_sent_at";

/**
 * Orders list. Default order: newest paid-but-unfulfilled first (paid → newest,
 * then everything else newest first). Optional status filter + free-text search
 * over customer name / email / order reference.
 */
type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export async function listAdminOrders(options: {
  q?: string;
  status?: string;
} = {}): Promise<AdminOrder[]> {
  const supabase = createAdminSupabase();
  const query = supabase.from("orders").select(ORDER_LIST_SELECT);

  if (options.status) {
    const statuses = options.status
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is OrderStatus =>
        ["pending", "paid", "fulfilled", "cancelled", "refunded"].includes(s)
      );
    if (statuses.length === 1) query.eq("status", statuses[0] as OrderStatus);
    else if (statuses.length > 1) query.in("status", statuses);
  }
  if (options.q?.trim()) {
    const needle = `%${sanitizeSearch(options.q)}%`;
    query.or(
      `customer_name.ilike.${needle},email.ilike.${needle},reference.ilike.${needle}`
    );
  }

  query.order("created_at", { ascending: false }).limit(200);

  const { data, error } = await query;
  if (error) throw new Error(`Admin orders list failed: ${error.message}`);

  const rows = (data ?? []) as Array<{
    id: string;
    reference: string;
    status: string;
    email: string;
    customer_name: string;
    city: string;
    country: string;
    total: number;
    currency: string;
    created_at: string;
    paid_at: string | null;
    confirmation_email_sent_at: string | null;
    shipped_email_sent_at: string | null;
  }>;

  const paidFirst = (row: { status: string }) => (row.status === "paid" ? 0 : 1);
  return [...rows]
    .sort(
      (a, b) =>
        paidFirst(a) - paidFirst(b) || (a.created_at < b.created_at ? 1 : -1)
    )
    .map((row) =>
      mapOrderRow({
        ...row,
        phone: "",
        address_line1: "",
        address_line2: "",
        subtotal: 0,
        shipping_total: 0,
        tracking_number: "",
        updated_at: row.created_at,
        order_items: [],
      })
    );
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, status, email, phone, customer_name, address_line1, address_line2, city, country, " +
        "subtotal, shipping_total, total, currency, paid_at, confirmation_email_sent_at, tracking_number, shipped_email_sent_at, created_at, updated_at, " +
        "order_items(id, name, size, price, qty, image)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Admin order fetch failed: ${error.message}`);
  if (!data) return null;
  return mapOrderRow(data as unknown as OrderRow);
}

// --- Drops ------------------------------------------------------------------

export type AdminDrop = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  productCount: number;
};

export async function listAdminDrops(): Promise<AdminDrop[]> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("drops")
    .select("id, name, is_active, created_at, products(id)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Admin drops list failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    created_at: row.created_at,
    productCount: Array.isArray(row.products) ? row.products.length : 0,
  }));
}

// --- Dashboard / overview ---------------------------------------------------

export type AdminOverview = {
  activeDropName: string | null;
  productCount: number;
  publishedProductCount: number;
  orderCounts: {
    pending: number;
    paid: number;
    fulfilled: number;
    cancelled: number;
  };
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createAdminSupabase();

  const [active, products, orders] = await Promise.all([
    supabase.rpc("get_active_drop"),
    supabase.from("products").select("id, is_published"),
    supabase.rpc("admin_orders_status_counts"),
  ]);

  const counts =
    (orders.data as unknown as { status: string; count: number }[] | null) ?? [];
  const orderCounts = { pending: 0, paid: 0, fulfilled: 0, cancelled: 0 };
  for (const row of counts) {
    if (row.status in orderCounts) {
      orderCounts[row.status as keyof typeof orderCounts] = row.count;
    }
  }

  const activeDrop =
    active.data as unknown as { id: string; name: string } | null;

  return {
    activeDropName: activeDrop?.name ?? null,
    productCount: products.data?.length ?? 0,
    publishedProductCount: (products.data ?? []).filter((p) => p.is_published)
      .length,
    orderCounts,
  };
}

/** Display helper (server-side formatting keeps the client dumb). */
export const prettyPrice = (order: { total: number; currency: string }) =>
  formatPrice(order.currency, order.total);