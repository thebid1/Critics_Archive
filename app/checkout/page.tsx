"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const checkoutFields: Array<[keyof CheckoutForm, string, string]> = [
  ["email", "Email", "email"],
  ["phone", "Phone number", "tel"],
  ["customerName", "Full name", "text"],
  ["addressLine1", "Address", "text"],
  ["addressLine2", "Apartment / suite (optional)", "text"],
  ["city", "City", "text"],
];

type CheckoutForm = {
  email: string;
  phone: string;
  customerName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
};

const DELIVERY_FEE = 7000;

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (
        accessCode: string,
        callbacks?: {
          onSuccess?: (transaction: { reference?: string; trxref?: string }) => void;
          onCancel?: () => void;
          onError?: (error: { message?: string }) => void;
        }
      ) => void;
    };
  }
}

function CheckoutPageContent() {
  const { items, count, total, clearCart, removeItem, setQty } = useCart();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<CheckoutForm>({ email: "", phone: "", customerName: "", addressLine1: "", addressLine2: "", city: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [paystackReady, setPaystackReady] = useState(false);
  const [deliverySelected, setDeliverySelected] = useState(false);

  useEffect(() => {
    setReference(searchParams.get("reference"));
  }, [clearCart, searchParams]);

  useEffect(() => {
    if (!reference || paid) return;
    let cancelled = false;
    let attempts = 0;

    async function verify() {
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/paystack/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
        const result = (await response.json()) as {
          status?: string;
          message?: string;
          error?: string;
        };
        if (response.ok) {
          setPaid(true);
          setPending(false);
          clearCart();
          return;
        }
        if (response.status === 202 && attempts < 12 && !cancelled) {
          attempts += 1;
          setPending(true);
          window.setTimeout(verify, 5000);
          return;
        }
        if (!cancelled) {
          setPending(false);
          setError(
            result.message ??
              result.error ??
              `Payment is ${result.status ?? "not confirmed"}.`
          );
        }
      } catch (reason: unknown) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Payment verification failed.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void verify();
    return () => { cancelled = true; };
  }, [clearCart, paid, reference]);

  function retryVerification() {
    setError("");
    setPending(false);
    setBusy(true);
    window.location.reload();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!deliverySelected) throw new Error("Select delivery before continuing.");
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, deliverySelected, items: items.map(({ slug, size, qty }) => ({ slug, size, qty })) }) });
      const result = (await response.json()) as { accessCode?: string; reference?: string; error?: string };
      if (!response.ok || !result.accessCode || !result.reference) throw new Error(result.error ?? "We could not start payment.");
      if (!paystackReady || !window.PaystackPop) throw new Error("Payment checkout is still loading. Please try again.");
      const popup = new window.PaystackPop();
      const releaseReservation = () => {
        void fetch("/api/paystack/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: result.reference }) });
      };
      popup.resumeTransaction(result.accessCode, {
        onSuccess: (transaction) => {
          const paidReference = transaction.reference ?? transaction.trxref ?? result.reference;
          if (!paidReference) {
            setError("Paystack returned no payment reference.");
            setBusy(false);
            return;
          }
          void fetch("/api/paystack/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: paidReference }) })
            .then(async (verification) => {
              const verificationResult = (await verification.json()) as { error?: string };
              if (!verification.ok) throw new Error(verificationResult.error ?? "Payment is still being verified.");
              setReference(paidReference);
            })
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Payment verification failed."))
            .finally(() => setBusy(false));
        },
        onCancel: () => { releaseReservation(); setError("Payment was cancelled. You can try again when ready."); setBusy(false); },
        onError: (paymentError) => { releaseReservation(); setError(paymentError.message ?? "Paystack could not load the payment."); setBusy(false); },
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not start payment.");
      setBusy(false);
    }
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onLoad={() => setPaystackReady(typeof window.PaystackPop === "function")}
        onReady={() => setPaystackReady(typeof window.PaystackPop === "function")}
        onError={() => setError("Paystack checkout could not load. Check your connection and try again.")}
      />
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-3">Secure checkout</p>
          <h1 className="font-display text-4xl uppercase leading-none text-bone sm:text-5xl">
            Checkout
          </h1>

          {paid ? (
            <div className="mt-10 border border-accent p-6">
              <p className="font-label text-xs uppercase tracking-widest2 text-accent">Payment confirmed</p>
              <p className="mt-3 font-body text-sm text-bone-dim">Your order is being prepared. A confirmation will be sent to your email.</p>
            </div>
          ) : reference ? (
            <div className="mt-10 border border-hairline p-6">
              <p className="font-label text-xs uppercase tracking-widest2 text-bone">Verifying payment</p>
              <p className="mt-3 font-body text-sm leading-relaxed text-bone-dim">
                {pending ? "Your bank has not finalized the transaction yet. We are checking again shortly. Do not pay again." : error}
              </p>
              {!busy && <button type="button" onClick={retryVerification} className="mt-5 border border-bone px-6 py-3 font-label text-xs uppercase tracking-widest2 text-bone hover:border-accent hover:text-accent">Check again</button>}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10">
              <p className="font-body text-sm text-bone-dim">Your bag is empty.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block border border-bone px-6 py-3 font-label text-xs uppercase tracking-widest2 text-bone transition-colors hover:border-accent hover:text-accent"
              >
                Shop the drop →
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-8 font-label text-xs uppercase tracking-widest2 text-bone-dim">
                Review your bag — {count} {count === 1 ? "item" : "items"}
              </p>

              <ul className="mt-4 divide-y divide-hairline">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 py-5">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink-raised">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="font-label text-xs uppercase tracking-wide text-bone">
                        {item.name}
                      </p>
                      {item.size && (
                        <p className="mt-1 font-label text-[10px] uppercase tracking-wide text-bone-dim">
                          Size — {item.size}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-3">
                        <div className="flex items-center border border-hairline">
                          <button type="button" onClick={() => setQty(item.key, item.qty - 1)} aria-label={`Decrease quantity of ${item.name}`} className="px-2 py-1 font-label text-sm text-bone-dim hover:text-accent">−</button>
                          <span className="min-w-7 text-center font-label text-xs text-bone">{item.qty}</span>
                          <button type="button" onClick={() => setQty(item.key, item.qty + 1)} disabled={item.qty >= item.maxQty} aria-label={`Increase quantity of ${item.name}`} className="px-2 py-1 font-label text-sm text-bone-dim hover:text-accent disabled:cursor-not-allowed disabled:opacity-30">+</button>
                        </div>
                        <button type="button" onClick={() => removeItem(item.key)} className="font-label text-[10px] uppercase tracking-wide text-bone-dim underline underline-offset-4 hover:text-accent">Remove</button>
                      </div>
                    </div>
                    <p className="font-label text-sm text-bone">
                      {formatPrice(item.currency, item.price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-baseline justify-between border-t border-hairline pt-6">
                <span className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
                  Subtotal
                </span>
                <span className="font-label text-base text-bone">
                  {items.length > 0 ? formatPrice(items[0]!.currency, total) : "—"}
                </span>
              </div>

              <div className="mt-4 border border-hairline p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={deliverySelected}
                    onChange={(event) => setDeliverySelected(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-accent"
                  />
                  <span className="font-label text-xs uppercase tracking-wide text-bone">
                    Delivery — {formatPrice("NGN", DELIVERY_FEE)}
                    <span className="mt-1 block font-body text-xs normal-case tracking-normal text-bone-dim">
                      Delivery is required. Pickup is not available.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-hairline pt-5">
                <span className="font-label text-xs uppercase tracking-widest2 text-bone-dim">Total</span>
                <span className="font-label text-base text-bone">
                  {items.length > 0 ? formatPrice(items[0]!.currency, total + DELIVERY_FEE) : "—"}
                </span>
              </div>

              <form onSubmit={submit} className="mt-10 border border-hairline p-6">
                <p className="font-label text-xs uppercase tracking-widest2 text-bone">Shipping details</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {checkoutFields.map(([key, label, type]) => (
                    <label key={key} className={`font-label text-[10px] uppercase tracking-wide text-bone-dim ${key === "addressLine1" || key === "addressLine2" ? "sm:col-span-2" : ""}`}>
                      {label}
                      <input type={type} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 block w-full border border-hairline bg-transparent px-3 py-3 font-body text-sm text-bone outline-none focus:border-accent" required={key !== "addressLine2"} />
                    </label>
                  ))}
                </div>
                {error && <p role="alert" className="mt-5 font-body text-sm text-red-300">{error}</p>}
                <button type="submit" disabled={busy || !paystackReady || !deliverySelected} className="mt-6 w-full bg-bone px-6 py-3.5 font-label text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-60">
                  {busy ? "Starting payment..." : !deliverySelected ? "Select delivery to continue" : paystackReady ? "Pay with Paystack" : "Loading payment..."}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="container-page py-24" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}