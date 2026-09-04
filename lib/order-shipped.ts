import { createAdminSupabase } from "@/lib/supabase/server";
import { sendOrderShippedEmail } from "@/lib/resend";

/**
 * Sends a shipped-notification for a fulfilled order (admin, Stage 7).
 * Idempotent: the shipped_email_sent_at marker prevents duplicate sends, and the
 * marker is only written AFTER a successful send. Email failure never changes
 * the (already committed) fulfillment state.
 */
export async function sendShippedForOrderId(
  orderId: string,
  trackingNumber: string
): Promise<string | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, email, phone, customer_name, subtotal, shipping_total, total, currency, " +
        "shipped_email_sent_at, confirmation_email_sent_at, " +
        "order_items(name, size, price, qty, image)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    console.error("Shipped email: order lookup failed", { orderId, error: error?.message });
    return "Order lookup failed.";
  }
  const order = data as unknown as {
    id: string;
    reference: string;
    email: string;
    phone: string;
    customer_name: string;
    subtotal: number;
    shipping_total: number;
    total: number;
    currency: string;
    shipped_email_sent_at: string | null;
    confirmation_email_sent_at: string | null;
    order_items: Array<{ name: string; size: string; price: number; qty: number; image: string }>;
  };
  if (order.shipped_email_sent_at) {
    return null; // already sent
  }

  const sendError = await sendOrderShippedEmail(
    {
      reference: order.reference,
      customerName: order.customer_name,
      phone: order.phone,
      contactEmail: order.email,
      items: order.order_items.map((item) => ({
        name: item.name,
        size: item.size ?? "",
        qty: item.qty,
        price: item.price,
        image: item.image ?? "",
      })),
      subtotal: order.subtotal,
      shipping: order.shipping_total,
      total: order.total,
      currency: order.currency,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
    },
    trackingNumber
  );
  if (sendError) {
    console.error("Shipped email: send failed", { orderId, error: sendError });
    return sendError;
  }

  const { error: markError } = await supabase
    .from("orders")
    .update({ shipped_email_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("shipped_email_sent_at", null);
  if (markError) {
    console.error("Shipped email: could not mark sent", { orderId, error: markError.message });
  }
  return null;
}