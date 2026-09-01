"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import type { ProductDetail } from "@/lib/products";

/**
 * Size selector + Add to bag / Buy now for the product page.
 * Inventory is ONE pool per product (e.g. 50 hoodies total, any size draws from it).
 * - Single-size pieces (scarf): no size step at all.
 * - Multi-size pieces: pick a size before either button enables.
 * - Add to bag → adds to the cart and opens the drawer.
 * - Buy now → adds to the cart (drawer stays shut) and goes straight to /checkout.
 * - Product at 0 stock = "Sold out" (buttons disabled).
 */
export default function ProductForm({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const router = useRouter();
  const sizes = product.sizes;
  const soldOut = product.stock <= 0;
  const singleSize = sizes.length === 1;

  const [selected, setSelected] = useState<string | null>(null);
  const canAct = !soldOut && (singleSize || !!selected);

  function handleAddToBag() {
    if (!canAct) return;
    addItem(product, singleSize ? undefined : selected!, true, product.stock);
  }

  function handleBuyNow() {
    if (!canAct) return;
    addItem(product, singleSize ? undefined : selected!, false, product.stock);
    router.push("/checkout");
  }

  return (
    <div>
      {!singleSize && (
        <>
          <p className="mb-3 font-label text-xs uppercase tracking-widest2 text-bone-dim">
            Select size
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isSelected = selected === s.size;
              return (
                <button
                  key={s.size}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setSelected(s.size)}
                  aria-pressed={isSelected}
                  className={`border px-4 py-2 font-label text-xs uppercase tracking-widest2 transition-colors ${
                    isSelected
                      ? "border-accent bg-accent text-ink"
                      : "border-hairline text-bone hover:border-bone"
                  }`}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleAddToBag}
          disabled={!canAct}
          className="border border-bone px-6 py-3.5 font-label text-xs uppercase tracking-widest2 text-bone transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-hairline/50 disabled:text-bone-dim/40 disabled:hover:border-hairline/50 disabled:hover:text-bone-dim/40"
        >
          Add to bag
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!canAct}
          className="bg-bone px-6 py-3.5 font-label text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-bone-dim/30 disabled:hover:bg-bone-dim/30"
        >
          {soldOut ? "Sold out" : "Buy now"}
        </button>
      </div>
    </div>
  );
}