"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartDrawer() {
  const { items, isOpen, close, count, total, removeItem, setQty } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={close}
        className={`fixed inset-0 z-50 bg-ink/70 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-out panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-hairline bg-ink-raised shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <h2 className="font-label text-xs uppercase tracking-widest2 text-bone">
            Bag — {count} {count === 1 ? "item" : "items"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="rounded-full p-2 font-label text-bone-dim transition-colors hover:text-accent"
          >
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
              Your bag is empty
            </p>
            <Link
              href="/shop"
              onClick={close}
              className="mt-2 inline-flex items-center gap-2 border border-bone px-5 py-2.5 font-label text-xs uppercase tracking-widest2 text-bone transition-colors hover:border-accent hover:text-accent"
            >
              Shop the drop →
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-hairline overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-label text-[11px] uppercase tracking-wide text-bone">
                          {item.name}
                        </p>
                        {item.size && (
                          <p className="mt-1 font-label text-[10px] uppercase tracking-wide text-bone-dim">
                            Size — {item.size}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="font-label text-[11px] uppercase text-bone-dim transition-colors hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-hairline">
                        <button
                          type="button"
                          onClick={() => setQty(item.key, item.qty - 1)}
                          aria-label="Decrease quantity"
                          className="px-2.5 py-1 font-label text-bone-dim transition-colors hover:text-accent"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-label text-xs text-bone">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.key, item.qty + 1)}
                          aria-label="Increase quantity"
                          className="px-2.5 py-1 font-label text-bone-dim transition-colors hover:text-accent"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-label text-sm text-bone">
                        {formatPrice(item.currency, item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-hairline px-6 py-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
                  Subtotal
                </span>
                <span className="font-label text-base text-bone">
                  {items.length > 0
                    ? formatPrice(items[0]!.currency, total)
                    : "—"}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className="block w-full bg-bone px-6 py-3.5 text-center font-label text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-accent"
              >
                {count > 0 ? `Checkout — ${count} item${count === 1 ? "" : "s"}` : "Checkout"}
              </Link>
              <p className="mt-3 text-center font-label text-[11px] uppercase tracking-wide text-bone-dim">
                Shipping &amp; taxes calculated at checkout
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}