"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Checkout — Stage 5 placeholder.
 * Shows the bag summary (what Buy Now / the drawer route to). Full Paystack
 * checkout (shipping form, server-side order creation, webhook) replaces this
 * in Stage 5. Deliberately client-side so it reads live cart state.
 */
export default function CheckoutPage() {
  const { items, count, total } = useCart();

  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-3">Secure checkout</p>
          <h1 className="font-display text-4xl uppercase leading-none text-bone sm:text-5xl">
            Checkout
          </h1>

          {items.length === 0 ? (
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
                      <p className="mt-auto font-label text-xs text-bone-dim">
                        Qty {item.qty}
                      </p>
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

              <div className="mt-10 border border-hairline p-6">
                <p className="font-label text-xs uppercase tracking-widest2 text-bone">
                  Payment — coming soon
                </p>
                <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-bone-dim">
                  Card payments via Paystack are wired in the next stage. Review
                  your bag above for now.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed bg-bone-dim/30 px-6 py-3.5 font-label text-xs uppercase tracking-widest2 text-bone-dim"
                >
                  Pay with Paystack
                </button>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}