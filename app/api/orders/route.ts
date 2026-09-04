import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { initializePaystackTransaction, toPaystackMinorUnits } from "@/lib/paystack";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const DELIVERY_FEE = 7000;

/** Read + JSON-parse the body, enforcing a hard size cap even without Content-Length. */
async function readJsonBody(request: Request): Promise<
  | { body: unknown; error: null; status: null }
  | { body: null; error: string; status: number }
> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { body: null, error: "Unable to read request body.", status: 400 };
  }
  if (raw.length > 32_768) return { body: null, error: "Request is too large.", status: 413 };
  try {
    return { body: JSON.parse(raw) as unknown, error: null, status: null };
  } catch {
    return { body: null, error: "Invalid JSON.", status: 400 };
  }
}

export async function POST(request: Request) {
  // Rate limit: protects both DB writes and upstream Paystack calls.
  const ip = getClientIp(request);
  const limiter = rateLimit({ ip, limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limiter.resetAt - Date.now()) / 1000)) } }
    );
  }

  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  }

  const { body, error, status } = await readJsonBody(request);
  if (error) return NextResponse.json({ error }, { status: status ?? 400 });

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  }
  const input = parsed.data;

  try {
    const supabase = createAdminSupabase();
    // Release abandoned reservations before checking out new customers.
    await supabase.rpc("expire_pending_orders", { p_max_age_hours: 24 });
    const { data, error: rpcError } = await supabase.rpc("create_order", {
      p_email: input.email,
      p_phone: input.phone,
      p_customer_name: input.customerName,
      p_address_line1: input.addressLine1,
      p_address_line2: input.addressLine2 ?? "",
      p_city: input.city,
      p_country: "NG",
      p_delivery_fee: DELIVERY_FEE,
      p_currency: "NGN",
      p_items: input.items.map((item) => ({ slug: item.slug, size: item.size, qty: item.qty })),
    });
    if (rpcError) {
      // Map the RPC's intentional stock failures to clean status codes.
      const msg = (rpcError.message ?? "").toLowerCase();
      if (msg.includes("insufficient_stock")) {
        return NextResponse.json({ error: "A product is out of stock." }, { status: 409 });
      }
      if (msg.includes("product_unavailable")) {
        return NextResponse.json({ error: "A product is unavailable." }, { status: 400 });
      }
      if (msg.includes("size")) {
        return NextResponse.json({ error: "A selected size is unavailable." }, { status: 400 });
      }
      if (msg.includes("bad_currency")) {
        return NextResponse.json({ error: "Cart currencies must match." }, { status: 400 });
      }
      throw rpcError;
    }

    const orderData = (data as unknown as {
      reference: string;
      order_id: string;
      subtotal: number;
      total: number;
      currency: string;
    }) ?? {};
    const { reference, order_id, subtotal, total, currency } = orderData;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const payment = await initializePaystackTransaction({
      email: input.email,
      amount: toPaystackMinorUnits(total, currency),
      currency,
      reference,
      callbackUrl: `${siteUrl}/checkout`,
      orderId: order_id,
    });

    return NextResponse.json({
      authorizationUrl: payment.data.authorization_url,
      accessCode: payment.data.access_code,
      reference: payment.data.reference,
      orderId: order_id,
      subtotal,
      total,
    });
  } catch (error) {
    console.error("Checkout initialization failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "We could not start payment. Please try again." }, { status: 500 });
  }
}