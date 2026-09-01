import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { initializePaystackTransaction, toPaystackMinorUnits } from "@/lib/paystack";

export const dynamic = "force-dynamic";

type CheckoutItem = { slug: string; size: string; qty: number };
type CheckoutBody = {
  email: string;
  phone: string;
  customerName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  items: CheckoutItem[];
};

function isNonEmpty(value: unknown, max = 200): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isValidBody(value: unknown): value is CheckoutBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  const items = body.items;
  return (
    typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) &&
    typeof body.phone === "string" && /^\+?[0-9 ()-]{7,20}$/.test(body.phone) &&
    isNonEmpty(body.customerName) && isNonEmpty(body.addressLine1) &&
    (body.addressLine2 === undefined || typeof body.addressLine2 === "string") &&
    isNonEmpty(body.city) && isNonEmpty(body.country, 3) &&
    Array.isArray(items) && items.length > 0 && items.length <= 50 &&
    items.every((item) => {
      if (typeof item !== "object" || item === null) return false;
      const line = item as Record<string, unknown>;
      return isNonEmpty(line.slug, 120) && typeof line.size === "string" &&
        Number.isInteger(line.qty) && (line.qty as number) >= 1 && (line.qty as number) <= 99;
    })
  );
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
      return NextResponse.json({ error: "JSON is required." }, { status: 415 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 32_768) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const body: unknown = await request.json();
    if (!isValidBody(body)) {
      return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    const slugs = body.items.map((item) => item.slug);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, slug, name, price, currency, stock, product_images(url, position), product_variants(id, size)")
      .in("slug", slugs)
      .eq("is_published", true)
      .is("archived_at", null);
    if (productsError) throw productsError;

    const rows = (products ?? []) as unknown as Array<{
      id: string; slug: string; name: string; price: number; currency: string; stock: number;
      product_images: { url: string; position: number }[];
      product_variants: { id: string; size: string }[];
    }>;
    const bySlug = new Map(rows.map((product) => [product.slug, product]));
    const currencies = new Set(rows.map((product) => product.currency));
    if (currencies.size !== 1) return NextResponse.json({ error: "Cart currencies must match." }, { status: 400 });

    let total = 0;
    const orderItems = [];
    const requested = new Map<string, number>();
    for (const item of body.items) {
      const product = bySlug.get(item.slug);
      if (!product) return NextResponse.json({ error: "A product is unavailable." }, { status: 400 });
      const variant = item.size
        ? product.product_variants.find((candidate) => candidate.size === item.size)
        : product.product_variants.length === 1
          ? product.product_variants[0]
          : undefined;
      if (product.product_variants.length > 0 && !variant) {
        return NextResponse.json({ error: "A selected size is unavailable." }, { status: 400 });
      }
      const key = product.id;
      const qty = (requested.get(key) ?? 0) + item.qty;
      if (qty > product.stock) return NextResponse.json({ error: `${product.name} is out of stock.` }, { status: 409 });
      requested.set(key, qty);
      total += product.price * item.qty;
      const image = [...product.product_images].sort((a, b) => a.position - b.position)[0]?.url ?? "";
      orderItems.push({ product_id: product.id, product_variant_id: variant?.id ?? null, name: product.name, size: item.size, price: product.price, qty: item.qty, image });
    }

    const reference = `ca_${randomUUID().replaceAll("-", "")}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ reference, email: body.email.trim(), phone: body.phone.trim(), customer_name: body.customerName.trim(), address_line1: body.addressLine1.trim(), address_line2: body.addressLine2?.trim() ?? "", city: body.city.trim(), country: body.country.trim(), subtotal: total, total, currency: [...currencies][0], status: "pending" })
      .select("id, reference")
      .single();
    if (orderError || !order) throw orderError ?? new Error("Order creation failed.");

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) throw itemsError;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const currency = [...currencies][0]!;
    const payment = await initializePaystackTransaction({ email: body.email.trim(), amount: toPaystackMinorUnits(total, currency), currency, reference, callbackUrl: `${siteUrl}/checkout`, orderId: order.id });
    return NextResponse.json({ authorizationUrl: payment.data.authorization_url, accessCode: payment.data.access_code, reference: payment.data.reference });
  } catch (error) {
    console.error("Checkout initialization failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "We could not start payment. Please try again." }, { status: 500 });
  }
}