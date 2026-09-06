import { Resend } from "resend";
import { readFileSync } from "node:fs";
import path from "node:path";

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
const FOOTER_LOGO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png";

// Lazily construct so we only instantiate when actually sending (avoids
// throwing during build/import when the key isn't present).
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!resendApiKey) return null;
  if (!_resend) _resend = new Resend(resendApiKey);
  return _resend;
}

export type OrderConfirmationLine = {
  name: string;
  size: string;
  qty: number;
  price: number;
  image: string;
};

export type OrderConfirmation = {
  reference: string;
  customerName: string;
  phone: string;
  contactEmail: string; // customer email to send to
  items: OrderConfirmationLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
};

const symbolFor = (currency: string): string =>
  currency === "NGN" ? "₦" : `${currency} `;

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const safeImageUrl = (value: string): string => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? escapeHtml(url.toString()) : "";
  } catch {
    return "";
  }
};

/** Send a plain-HTML order confirmation. Returns error message (or null on success). */
export async function sendOrderConfirmationEmail(
  order: OrderConfirmation
): Promise<string | null> {
  const client = getResend();
  if (!client || !fromEmail) {
    return "Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)";
  }

  const safe = {
    reference: escapeHtml(order.reference),
    customerName: escapeHtml(order.customerName || "there"),
    phone: escapeHtml(order.phone),
    addressLine1: escapeHtml(order.addressLine1),
    addressLine2: escapeHtml(order.addressLine2),
    city: escapeHtml(order.city),
    state: escapeHtml(order.state),
    country: escapeHtml(order.country),
  };
  const sym = symbolFor(order.currency);
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-NG")}`;
  const address = [safe.addressLine1, safe.addressLine2, safe.city, safe.state, safe.country]
    .filter(Boolean)
    .join(", ");
  const wordmark = readFileSync(
    path.join(process.cwd(), "public", "critics-archive-wordmark.png")
  );

  const itemRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">
          ${safeImageUrl(i.image) ? `<img src="${safeImageUrl(i.image)}" alt="" width="56" height="56" style="display:inline-block;width:56px;height:56px;object-fit:cover;vertical-align:middle;margin-right:10px" />` : ""}
          <span style="vertical-align:middle">${escapeHtml(i.name)}${i.size ? ` — ${escapeHtml(i.size)}` : ""}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">× ${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right">${fmt(i.price * i.qty)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin:0;padding:0;background:#f7f6f1;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:24px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e2da;border-radius:4px">
          <tr>
            <td bgcolor="#000000" style="padding:32px 32px 16px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
            <img src="cid:critics-archive-wordmark" alt="Critics Archive" width="220" height="33" style="display:block;width:220px;height:33px;object-fit:contain;object-position:left" />
            <p style="margin:10px 0 0;font-size:12px;letter-spacing:2px;color:#f4f3ed">SWAG IS ART</p>
            </td>
          </tr>
          <tr><td style="padding:8px 32px">
            <h2 style="margin:16px 0 4px;font-size:16px;color:#0a0a09">Thank you, ${safe.customerName}.</h2>
            <p style="margin:0;font-size:14px;color:#333;line-height:1.5">Your order has been received and is being prepared.</p>
            <p style="margin:12px 0 0;font-size:13px;color:#555">Order reference: <strong>${safe.reference}</strong></p>
            <p style="margin:6px 0 0;font-size:13px;color:#555">Phone: ${safe.phone}</p>
          </td></tr>
          <tr><td style="padding:16px 32px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th align="left" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Item</th>
                <th align="left" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Qty</th>
                <th align="right" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Total</th>
              </tr>
              ${itemRows}
            </table>
          </td></tr>
          <tr><td style="padding:16px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:14px;color:#555;padding:2px 0">Subtotal</td><td align="right" style="font-size:14px;color:#333;padding:2px 0">${fmt(order.subtotal)}</td></tr>
              <tr><td style="font-size:14px;color:#555;padding:2px 0">Delivery</td><td align="right" style="font-size:14px;color:#333;padding:2px 0">${fmt(order.shipping)}</td></tr>
              <tr><td style="font-size:14px;color:#0a0a09;font-weight:bold;padding:6px 0;border-top:1px solid #eee">Total</td><td align="right" style="font-size:14px;color:#0a0a09;font-weight:bold;padding:6px 0;border-top:1px solid #eee">${fmt(order.total)}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 32px 8px">
            <p style="margin:0;font-size:12px;letter-spacing:1px;color:#8a877e">DELIVER TO</p>
            <p style="margin:6px 0 0;font-size:14px;color:#333;line-height:1.6">${safe.customerName}<br />${address}</p>
          </td></tr>
          <tr>
            <td bgcolor="#000000" style="padding:16px 32px 32px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <img src="${FOOTER_LOGO_IMAGE}" alt="Critics Archive logo" width="40" height="40" style="display:block;width:40px;height:40px;object-fit:contain" />
              <p style="margin:10px 0 0;font-size:11px;color:#f4f3ed;letter-spacing:1px">CRITICS ARCHIVE — SWAG IS ART.</p>
              <p style="margin:8px 0 0;font-size:12px;color:#f4f3ed">Questions? Contact <a href="mailto:support@criticsarchive.com" style="color:#ffffff">support@criticsarchive.com</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Critics Archive <${fromEmail}>`,
      to: order.contactEmail,
      subject: `Your CRITICS ARCHIVE order ${order.reference} is confirmed`,
      html,
      attachments: [
        {
          filename: "critics-archive-wordmark.png",
          content: wordmark,
          contentType: "image/png",
          contentId: "critics-archive-wordmark",
        },
      ],
    });
    return error?.message ?? null;
  } catch (reason) {
    return reason instanceof Error ? reason.message : "Unknown email send failure";
  }
}
/**
 * Shipped-notification email (Stage 7). Same Resend client + escaping helpers
 * as the Stage 6 confirmation template. Triggered server-side only, after the
 * order flips to `fulfilled` with an optional tracking number.
 */
export async function sendOrderShippedEmail(
  order: OrderConfirmation,
  trackingNumber: string
): Promise<string | null> {
  const client = getResend();
  if (!client || !fromEmail) {
    return "Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)";
  }

  const safe = {
    reference: escapeHtml(order.reference),
    customerName: escapeHtml(order.customerName || "there"),
    trackingNumber: escapeHtml(trackingNumber || ""),
  };
  const sym = symbolFor(order.currency);
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-NG")}`;
  const wordmark = readFileSync(
    path.join(process.cwd(), "public", "critics-archive-wordmark.png")
  );

  const itemSummary = order.items
    .map(
      (i) =>
        `<li style="font-size:14px;color:#333;padding:4px 0">${escapeHtml(i.name)}${
          i.size ? ` — ${escapeHtml(i.size)}` : ""
        } × ${i.qty} · ${fmt(i.price * i.qty)}</li>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin:0;padding:0;background:#f7f6f1;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:24px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e2da;border-radius:4px">
          <tr>
            <td bgcolor="#000000" style="padding:32px 32px 16px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <img src="cid:critics-archive-wordmark" alt="Critics Archive" width="220" height="33" style="display:block;width:220px;height:33px;object-fit:contain;object-position:left" />
              <p style="margin:10px 0 0;font-size:12px;letter-spacing:2px;color:#f4f3ed">SWAG IS ART</p>
            </td>
          </tr>
          <tr><td style="padding:8px 32px">
            <h2 style="margin:16px 0 4px;font-size:16px;color:#0a0a09">Your order is on the way, ${safe.customerName}.</h2>
            <p style="margin:0;font-size:14px;color:#333;line-height:1.5">Order <strong>${safe.reference}</strong> has been shipped${
              safe.trackingNumber ? ` with tracking <strong>${safe.trackingNumber}</strong>` : ""
            }.</p>
          </td></tr>
          <tr><td style="padding:8px 32px 0">
            <p style="margin:0;font-size:12px;letter-spacing:1px;color:#8a877e">IN THIS ORDER</p>
            <ul style="margin:8px 0 0;padding-left:18px">${itemSummary}</ul>
          </td></tr>
          <tr><td style="padding:8px 32px 0">
            <p style="margin:0;font-size:13px;color:#555">Total paid: <strong>${fmt(order.total)}</strong></p>
          </td></tr>
          <tr>
            <td bgcolor="#000000" style="padding:16px 32px 32px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <img src="${FOOTER_LOGO_IMAGE}" alt="Critics Archive logo" width="40" height="40" style="display:block;width:40px;height:40px;object-fit:contain" />
              <p style="margin:10px 0 0;font-size:11px;color:#f4f3ed;letter-spacing:1px">CRITICS ARCHIVE — SWAG IS ART.</p>
              <p style="margin:8px 0 0;font-size:12px;color:#f4f3ed">Questions? Contact <a href="mailto:support@criticsarchive.com" style="color:#ffffff">support@criticsarchive.com</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Critics Archive <${fromEmail}>`,
      to: order.contactEmail,
      subject: `${safe.trackingNumber ? "Shipped" : "On the way"} — CRITICS ARCHIVE order ${order.reference}`,
      html,
      attachments: [
        {
          filename: "critics-archive-wordmark.png",
          content: wordmark,
          contentType: "image/png",
          contentId: "critics-archive-wordmark",
        },
      ],
    });
    return error?.message ?? null;
  } catch (reason) {
    return reason instanceof Error ? reason.message : "Unknown email send failure";
  }
}

/**
 * "New order" notification to the STORE OWNER (not the customer). Sent to
 * ORDERS_NOTIFY_EMAIL (comma-separated) when a payment succeeds, so the client
 * knows the moment someone purchases. Fails silently (returns null) if no owner
 * address is configured.
 */
export async function sendNewOrderNotificationEmail(
  order: OrderConfirmation & { orderId: string }
): Promise<string | null> {
  const client = getResend();
  const notifyTo = (process.env.ORDERS_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!client || !fromEmail) {
    return "Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)";
  }
  if (notifyTo.length === 0) {
    return null; // no owner address configured — not an error
  }

  const safe = {
    reference: escapeHtml(order.reference),
    customerName: escapeHtml(order.customerName || "—"),
    email: escapeHtml(order.contactEmail || "—"),
    phone: escapeHtml(order.phone || "—"),
  };
  const sym = symbolFor(order.currency);
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-NG")}`;
  const address = [
    escapeHtml(order.addressLine1),
    escapeHtml(order.addressLine2),
    escapeHtml(order.city),
    escapeHtml(order.state),
    escapeHtml(order.country),
  ]
    .filter(Boolean)
    .join(", ");
  const adminUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  }/admin/orders/${order.orderId}`;

  const itemRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">${escapeHtml(i.name)}${
        i.size ? ` — ${escapeHtml(i.size)}` : ""
      }</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333">× ${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right">${fmt(
          i.price * i.qty
        )}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin:0;padding:0;background:#f7f6f1;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:24px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e2da;border-radius:4px">
          <tr>
            <td bgcolor="#000000" style="padding:32px 32px 16px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:1px">NEW ORDER</p>
              <p style="margin:6px 0 0;font-size:12px;letter-spacing:2px;color:#f4f3ed">CRITICS ARCHIVE</p>
            </td>
          </tr>
          <tr><td style="padding:16px 32px">
            <p style="margin:0;font-size:14px;color:#333">Order <strong>${safe.reference}</strong> just came in — <strong>${fmt(order.total)}</strong>.</p>
            <p style="margin:6px 0 0;font-size:13px;color:#555">Customer: ${safe.customerName} · ${safe.email}${safe.phone !== "—" ? ` · ${safe.phone}` : ""}</p>
          </td></tr>
          <tr><td style="padding:8px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th align="left" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Item</th>
                <th align="left" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Qty</th>
                <th align="right" style="border-bottom:2px solid #0a0a09;padding:6px 0;font-size:12px;letter-spacing:1px;color:#0a0a09">Total</th>
              </tr>
              ${itemRows}
            </table>
          </td></tr>
          <tr><td style="padding:12px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:14px;color:#555;padding:2px 0">Subtotal</td><td align="right" style="font-size:14px;color:#333;padding:2px 0">${fmt(order.subtotal)}</td></tr>
              <tr><td style="font-size:14px;color:#555;padding:2px 0">Delivery</td><td align="right" style="font-size:14px;color:#333;padding:2px 0">${fmt(order.shipping)}</td></tr>
              <tr><td style="font-size:14px;color:#0a0a09;font-weight:bold;padding:6px 0;border-top:1px solid #eee">Total</td><td align="right" style="font-size:14px;color:#0a0a09;font-weight:bold;padding:6px 0;border-top:1px solid #eee">${fmt(order.total)}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 32px 16px">
            <p style="margin:0;font-size:12px;letter-spacing:1px;color:#8a877e">SHIP TO</p>
            <p style="margin:6px 0 0;font-size:14px;color:#333;line-height:1.6">${safe.customerName}<br />${address}</p>
          </td></tr>
          <tr><td style="padding:0 32px 32px">
            <a href="${adminUrl}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:10px 20px;font-size:13px;border-radius:4px">View order in admin</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Critics Archive <${fromEmail}>`,
      to: notifyTo,
      subject: `New order ${order.reference} — ${fmt(order.total)}`,
      html,
    });
    return error?.message ?? null;
  } catch (reason) {
    return reason instanceof Error ? reason.message : "Unknown email send failure";
  }
}

/**
 * Newsletter "welcome" email — sent when someone subscribes in the Community
 * section. From COMMUNITY_FROM_EMAIL, carries the CRITICS statement, a big
 * "Browse the drop" button, and an unsubscribe link.
 */
export async function sendNewsletterWelcomeEmail(options: {
  email: string;
  unsubscribeUrl: string;
  shopUrl: string;
}): Promise<string | null> {
  const client = getResend();
  const communityFrom = process.env.COMMUNITY_FROM_EMAIL ?? "";
  if (!client || !communityFrom) {
    return "Community email is not configured (RESEND_API_KEY / COMMUNITY_FROM_EMAIL)";
  }

  const wordmark = readFileSync(
    path.join(process.cwd(), "public", "critics-archive-wordmark.png")
  );
  const safeUnsubscribe = escapeHtml(options.unsubscribeUrl);
  const safeShopUrl = escapeHtml(options.shopUrl);

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin:0;padding:0;background:#f7f6f1;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:24px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e2da;border-radius:4px">
          <tr>
            <td bgcolor="#000000" style="padding:32px 32px 16px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <img src="cid:critics-archive-wordmark" alt="Critics Archive" width="220" height="33" style="display:block;width:220px;height:33px;object-fit:contain;object-position:left" />
              <p style="margin:10px 0 0;font-size:12px;letter-spacing:2px;color:#f4f3ed">SWAG IS ART</p>
            </td>
          </tr>
          <tr><td style="padding:24px 32px 8px">
            <h2 style="margin:0;font-size:22px;line-height:1.25;color:#0a0a09">We don&apos;t follow culture.<br />We archive it.</h2>
          </td></tr>
          <tr><td style="padding:12px 32px 20px">
            <p style="margin:0;font-size:14px;color:#333;line-height:1.7">Welcome to the archive. CRITICS is built on the belief that personal style is the highest form of self-expression. Each piece is designed to hold meaning beyond the season — made to be worn, studied, and kept. SWAG IS ART is not a slogan. It is a conviction.</p>
          </td></tr>
          <tr><td style="padding:0 32px 20px">
            <p style="margin:0;font-size:13px;color:#555">You&apos;re on the list. Here&apos;s what that means:</p>
            <ul style="margin:10px 0 0;padding-left:18px;font-size:14px;color:#333;line-height:1.8">
              <li>Be the first to know about new drops</li>
              <li>Member discounts &amp; promotions</li>
              <li>Early access to limited pieces</li>
            </ul>
          </td></tr>
          <tr><td style="padding:0 32px 24px">
            <a href="${safeShopUrl}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:15px;font-weight:bold;letter-spacing:1px;border-radius:4px">Browse the drop</a>
          </td></tr>
          <tr>
            <td bgcolor="#000000" style="padding:16px 32px 24px;background:#000000 !important;background-color:#000000 !important;color:#ffffff !important">
              <img src="${FOOTER_LOGO_IMAGE}" alt="Critics Archive logo" width="40" height="40" style="display:block;width:40px;height:40px;object-fit:contain" />
              <p style="margin:10px 0 0;font-size:11px;color:#f4f3ed;letter-spacing:1px">CRITICS ARCHIVE — SWAG IS ART.</p>
              <p style="margin:12px 0 0;font-size:12px;color:#f4f3ed"><a href="${safeUnsubscribe}" style="color:#f4f3ed;text-decoration:underline">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Critics Archive <${communityFrom}>`,
      to: options.email,
      subject: "Welcome to the archive",
      html,
      attachments: [
        {
          filename: "critics-archive-wordmark.png",
          content: wordmark,
          contentType: "image/png",
          contentId: "critics-archive-wordmark",
        },
      ],
    });
    return error?.message ?? null;
  } catch (reason) {
    return reason instanceof Error ? reason.message : "Unknown email send failure";
  }
}