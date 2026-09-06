import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_URL = "https://api.paystack.co";

/**
 * Convert the shop's whole-currency (major-unit) prices to Paystack minor units
 * (kobo for NGN). `Math.round` avoids floating-point tails (e.g. 29.99 * 100 ->
 * 2998.9999...) which Paystack rejects with a 400.
 */
export function toPaystackMinorUnits(amount: number, currency: string): number {
  // Paystack currently requires XOF amounts to be multiplied by 100 too,
  // despite XOF having no fractional denomination.
  return ["NGN", "USD", "GHS", "ZAR", "KES", "XOF"].includes(currency)
    ? Math.round(amount * 100)
    : Math.round(amount);
}

export function fromPaystackMinorUnits(amount: number, currency: string): number {
  return ["NGN", "USD", "GHS", "ZAR", "KES", "XOF"].includes(currency)
    ? Math.round(amount / 100)
    : amount;
}

/**
 * Amount to verify against the order total, expressed in MAJOR units (naira).
 * Prefer `requested_amount` (what the merchant initialized = order only) over
 * `amount` (total charged = order + any fee passed to the customer). Falls back
 * to `amount` when `requested_amount` is absent on older transactions.
 */
export function paidAmountInMajorUnits(payment: {
  amount?: number;
  requested_amount?: number | null;
  currency?: string;
}): number {
  return fromPaystackMinorUnits(
    payment.requested_amount ?? payment.amount ?? 0,
    payment.currency ?? "NGN"
  );
}

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getSecretKey()}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch (reason) {
    // Network failure (fetch throws — e.g. DOMException TimeoutError) — surface a
    // clear Error instead of letting a non-Error value bubble up and mask the log.
    throw new Error(
      `Could not reach Paystack: ${reason instanceof Error ? reason.message : String(reason)}`
    );
  }

  let body: T & { status?: boolean; message?: string };
  try {
    body = (await response.json()) as T & { status?: boolean; message?: string };
  } catch {
    throw new Error(`Paystack returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok || body.status === false) {
    throw new Error(`Paystack request failed (${response.status}): ${body.message ?? "Unknown error"}`);
  }
  return body;
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  /** Original amount the transaction was initialized with (excludes any fee
   *  passed to the customer). `amount` is the TOTAL charged (order + fee). */
  requested_amount?: number | null;
  currency: string;
  [key: string]: unknown;
};

type InitializeResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string };
};

type VerifyResponse = {
  status: boolean;
  message: string;
  data: PaystackTransaction;
};

export function initializePaystackTransaction(input: {
  email: string;
  /** Order total in Paystack MINOR units (kobo). Use `toPaystackMinorUnits`. */
  amountMinorUnits: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  orderId: string;
}) {
  return paystackRequest<InitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinorUnits,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: { order_id: input.orderId },
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackRequest<VerifyResponse>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" }
  );
}

export function isValidPaystackSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}