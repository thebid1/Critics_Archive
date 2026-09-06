"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";

// Brand logo asset (only place a logo is needed — the header).
// `res.cloudinary.com` is allow-listed in next.config.js `images.remotePatterns`.
const LOGO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png";

export default function Header() {
  const { count, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Link
          href="/"
          className="flex items-center gap-1"
          aria-label="CRITICS ARCHIVE — home"
        >
          <span className="relative block h-11 w-11 shrink-0 sm:h-12 sm:w-12">
            <Image
              src={LOGO_IMAGE}
              alt=""
              fill
              priority
              sizes="40px"
              className="object-contain"
            />
          </span>
          <span className="relative block h-[29px] w-[220px] shrink-0 sm:h-[33px] sm:w-[250px]">
            <Image
              src="/critics-archive-wordmark.png"
              alt="Critics Archive"
              fill
              priority
              sizes="(min-width: 640px) 250px, 220px"
              className="object-contain object-left"
            />
          </span>
        </Link>

        <div className="flex items-center gap-4 text-bone">
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

    </header>
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
