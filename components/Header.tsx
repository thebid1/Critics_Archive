"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Link
          href="/"
          className="font-script text-2xl leading-none text-bone sm:text-3xl"
          aria-label="CRITICS ARCHIVE — home"
        >
          Critics Archive
        </Link>

        <nav className="hidden items-center gap-8 font-label text-xs uppercase tracking-widest2 text-bone sm:flex">
          <Link href="/shop" className="transition-colors hover:text-accent">
            Shop
          </Link>
          <Link href="/about" className="transition-colors hover:text-accent">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4 text-bone">
          <button
            type="button"
            aria-label="Search"
            className="rounded-full p-2 transition-colors hover:text-accent"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            onClick={open}
            aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative rounded-full p-2 transition-colors hover:text-accent"
          >
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-label text-[10px] leading-none text-ink">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-6 border-t border-hairline px-5 py-2 font-label text-xs uppercase tracking-widest2 text-bone sm:hidden">
        <Link href="/shop" className="transition-colors hover:text-accent">
          Shop
        </Link>
        <Link href="/about" className="transition-colors hover:text-accent">
          About
        </Link>
      </nav>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
