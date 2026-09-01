import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_URL = "https://api.paystack.co";

/** Convert the shop's whole-currency prices to Paystack minor units. */
export function toPaystackMinorUnits(amount: number, currency: string): number {
  // Paystack currently requires XOF amounts to be multiplied by 100 too,
  // despite XOF having no fractional denomination.
  return ["NGN", "USD", "GHS", "ZAR", "KES", "XOF"].includes(currency)
    ? amount * 100
    : amount;
}

export function fromPaystackMinorUnits(amount: number, currency: string): number {
  return ["NGN", "USD", "GHS", "ZAR", "KES", "XOF"].includes(currency)
    ? amount / 100
    : amount;
}

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json()) as T & {
    status?: boolean;
    message?: string;
  };
  if (!response.ok || body.status === false) {
    throw new Error(`Paystack request failed (${response.status}): ${body.message ?? "Unknown error"}`);
  }
  return body;
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
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
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  orderId: string;
}) {
  return paystackRequest<InitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
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

export function isValidPaystackSignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}