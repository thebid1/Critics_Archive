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
    country: escapeHtml(order.country),
  };
  const sym = symbolFor(order.currency);
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-NG")}`;
  const address = [safe.addressLine1, safe.addressLine2, safe.city, safe.country]
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
          <tr><td style="padding:16px 32px 32px">
            <img src="${FOOTER_LOGO_IMAGE}" alt="Critics Archive logo" width="40" height="40" style="display:block;width:40px;height:40px;object-fit:contain" />
            <p style="margin:10px 0 0;font-size:11px;color:#8a877e;letter-spacing:1px">CRITICS ARCHIVE — SWAG IS ART.</p>
            <p style="margin:8px 0 0;font-size:12px;color:#555">Questions? Contact <a href="mailto:support@criticsarchive.com" style="color:#333">support@criticsarchive.com</a></p>
          </td></tr>
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