import { createAdminSupabase } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from "@/lib/resend";

/** Sends a confirmation for a paid order and skips already-sent orders. */
export async function sendOrderConfirmationForReference(reference: string): Promise<void> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, email, phone, customer_name, address_line1, address_line2, city, state, country, " +
        "subtotal, shipping_total, total, currency, confirmation_email_sent_at, " +
        "order_items(name, size, price, qty, image)"
    )
    .eq("reference", reference)
    .single();

  if (error || !data) {
    console.error("Confirmation email: order lookup failed", { reference, error: error?.message });
    return;
  }
  const order = data as unknown as {
    id: string;
    reference: string;
    email: string;
    phone: string;
    customer_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    country: string;
    subtotal: number;
    shipping_total: number;
    total: number;
    currency: string;
    confirmation_email_sent_at: string | null;
    order_items: Array<{ name: string; size: string; price: number; qty: number; image: string }>;
  };
  if (order.confirmation_email_sent_at) return;

  const items = ((order.order_items ?? []) as Array<{ name: string; size: string; price: number; qty: number; image: string }>).map((item) => ({
    name: item.name,
    size: item.size ?? "",
    price: item.price,
    qty: item.qty,
    image: item.image ?? "",
  }));
  const sendError = await sendOrderConfirmationEmail({
    reference: order.reference,
    customerName: order.customer_name,
    phone: order.phone,
    contactEmail: order.email,
    items,
    subtotal: order.subtotal,
    shipping: order.shipping_total,
    total: order.total,
    currency: order.currency,
    addressLine1: order.address_line1,
    addressLine2: order.address_line2,
    city: order.city,
    state: order.state,
    country: order.country,
  });
  if (sendError) {
    console.error("Confirmation email: send failed", { reference, error: sendError });
    return;
  }

  const { error: markError } = await supabase
    .from("orders")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", order.id)
    .is("confirmation_email_sent_at", null);
  if (markError) console.error("Confirmation email: could not mark sent", { reference, error: markError.message });
}

/** Sends the store-owner "new order" notification (idempotent). */
export async function sendOwnerNotificationForReference(reference: string): Promise<void> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, email, phone, customer_name, address_line1, address_line2, city, state, country, " +
        "subtotal, shipping_total, total, currency, owner_notified_at, " +
        "order_items(name, size, price, qty, image)"
    )
    .eq("reference", reference)
    .single();

  if (error || !data) {
    console.error("Owner notification: order lookup failed", { reference, error: error?.message });
    return;
  }
  const order = data as unknown as {
    id: string;
    reference: string;
    email: string;
    phone: string;
    customer_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    country: string;
    subtotal: number;
    shipping_total: number;
    total: number;
    currency: string;
    owner_notified_at: string | null;
    order_items: Array<{ name: string; size: string; price: number; qty: number; image: string }>;
  };
  if (order.owner_notified_at) return;

  const sendError = await sendNewOrderNotificationEmail({
    orderId: order.id,
    reference: order.reference,
    customerName: order.customer_name,
    phone: order.phone,
    contactEmail: order.email,
    items: (order.order_items ?? []).map((item) => ({
      name: item.name,
      size: item.size ?? "",
      price: item.price,
      qty: item.qty,
      image: item.image ?? "",
    })),
    subtotal: order.subtotal,
    shipping: order.shipping_total,
    total: order.total,
    currency: order.currency,
    addressLine1: order.address_line1,
    addressLine2: order.address_line2,
    city: order.city,
    state: order.state,
    country: order.country,
  });
  if (sendError) {
    console.error("Owner notification: send failed", { reference, error: sendError });
    return;
  }

  const { error: markError } = await supabase
    .from("orders")
    .update({ owner_notified_at: new Date().toISOString() })
    .eq("id", order.id)
    .is("owner_notified_at", null);
  if (markError) console.error("Owner notification: could not mark sent", { reference, error: markError.message });
}

/** Send both the customer confirmation and the store-owner notification. */
export async function sendOrderNotificationsForReference(reference: string): Promise<void> {
  await sendOrderConfirmationForReference(reference);
  await sendOwnerNotificationForReference(reference);
}