"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import type { MouseEvent } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  // In-stock pieces add to the bag (which opens the cart drawer) — this is the
  // "click the shop item to open the bag" behaviour requested. Sold-out pieces
  // still route to the product page.
  function handleClick(e: MouseEvent) {
    if (product.inStock) {
      e.preventDefault();
      addItem(product);
    }
  }

  return (
    <Link href={`/product/${product.slug}`} onClick={handleClick} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-raised">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 380px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {product.isNew && (
          <span className="absolute left-3 top-3 bg-accent px-2 py-1 font-label text-[10px] uppercase tracking-widest2 text-ink">
            New
          </span>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
            <span className="font-label text-xs uppercase tracking-widest2 text-bone">
              Sold out
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-bone p-3 text-center transition-transform duration-300 group-hover:translate-y-0">
          <span className="font-label text-xs uppercase tracking-widest2 text-ink">
            {product.inStock ? "Add to bag" : "View piece"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="font-label text-xs uppercase tracking-wide text-bone">{product.name}</h3>
        <p className="font-label text-xs text-bone-dim">
          {formatPrice(product.currency, product.price)}
        </p>
      </div>
    </Link>
  );
}
