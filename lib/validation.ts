import { z } from "zod";
import { NIGERIA_STATE_SET } from "@/lib/nigeria-states";

/**
 * Shared Zod schemas for route-handler input (Stage 8). Every public-facing
 * POST body is validated here so malformed input is rejected before it touches
 * the database or an upstream API. Admin routes use lib/admin/request.ts (the
 * equivalent hand-rolled guards); these schemas cover the public surface.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const REFERENCE_RE = /^[A-Za-z0-9_.=-]{3,100}$/;

/** A trimmed, well-formed email address (≤ 254 chars). */
export const emailSchema = z.string().trim().regex(EMAIL_RE).max(254);

/** POST /api/orders — checkout. */
export const checkoutSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().regex(PHONE_RE),
  customerName: z.string().trim().min(1).max(200),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(200),
  state: z
    .string()
    .trim()
    .refine((s) => NIGERIA_STATE_SET.has(s), { message: "Select a valid state." }),
  deliverySelected: z.literal(true),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(120),
        size: z.string().trim().max(20),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
});

export type CheckoutBody = z.infer<typeof checkoutSchema>;

/** POST /api/paystack/verify — payment reference. */
export const verifySchema = z.object({
  reference: z.string().trim().regex(REFERENCE_RE),
});

/** POST /api/newsletter — subscriber email. */
export const newsletterSchema = z.object({
  email: emailSchema,
});