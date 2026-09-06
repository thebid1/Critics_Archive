"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

// Brand logo asset (only place a logo is needed — the header). The wordmark was
// removed from the bar; the logo lives in the drawer footer + footer now.
const LOGO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop#drop-001", label: "Drop 001" },
  { href: "/sizing", label: "Sizing" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, open } = useCart();
  const [navOpen, setNavOpen] = useState(false);

  // Close on Escape + lock body scroll while the drawer is open.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        {/* Left — hamburger */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
          aria-controls="site-nav-drawer"
          className="-ml-2 rounded-md p-2 text-bone transition-colors hover:text-accent"
        >
          <MenuIcon />
        </button>

        {/* Right — bag */}
        <button
          type="button"
          onClick={open}
          aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
          className="relative rounded-full p-2 text-bone transition-colors hover:text-accent"
        >
          <BagIcon />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-label text-[10px] leading-none text-ink">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop */}
      <div
        aria-hidden={!navOpen}
        onClick={() => setNavOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/70 transition-opacity duration-300 ${
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-out navigation drawer — slides from the left; same pattern as the bag. */}
      <aside
        id="site-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed left-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-r border-hairline bg-ink-raised shadow-2xl transition-transform duration-300 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <span className="font-label text-xs uppercase tracking-widest2 text-bone">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="rounded-full p-2 font-label text-bone-dim transition-colors hover:text-accent"
          >
            ✕
          </button>
        </header>

        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="space-y-0.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setNavOpen(false)}
                  className="block py-2.5 font-display text-2xl uppercase tracking-wide text-bone transition-colors hover:text-accent sm:text-3xl"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="border-t border-hairline px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="relative block h-10 w-10 shrink-0">
              <Image
                src={LOGO_IMAGE}
                alt=""
                fill
                sizes="40px"
                className="object-contain"
              />
            </span>
            <p className="font-display text-base uppercase tracking-widest text-bone">
              Critics Archive
            </p>
          </div>
        </footer>
      </aside>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
