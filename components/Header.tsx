"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";

// FIX: Define or import your logo image source
const LOGO_IMAGE = "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png"; 

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
  const { count, open: openCart } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Portal target isn't available during SSR — only render the portal once mounted.
  useEffect(() => setMounted(true), []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // Focus management: move focus into the drawer on open, trap Tab within it,
  // restore focus to whatever opened it on close.
  useEffect(() => {
    if (navOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNavOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

     const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Add this line to satisfy TypeScript's strict index checking
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="container-page relative flex h-16 items-center justify-between sm:h-20">
        {/* Left — hamburger */}
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
          aria-controls="site-nav-drawer"
          className="-ml-2 rounded-md p-2 text-bone transition-colors hover:text-accent"
        >
          <MenuIcon />
        </button>

        {/* Center — wordmark */}
        <Link
          href="/"
          aria-label="CRITICS ARCHIVE — home"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Image
            src="/critics-archive-wordmark.png"
            alt="CRITICS ARCHIVE"
            width={881}
            height={115}
            priority
            className="h-9 w-auto sm:h-12"
          />
        </Link>

        {/* Right — bag */}
        <button
          type="button"
          onClick={openCart}
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

      {mounted &&
        createPortal(
          <>
            <div
              aria-hidden={!navOpen}
              onClick={() => setNavOpen(false)}
              className={`fixed inset-0 z-50 bg-ink/70 transition-opacity duration-300 ${
                navOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            <aside
  ref={drawerRef}
  id="site-nav-drawer"
  role="dialog"
  aria-modal="true"
  aria-label="Navigation"
  inert={!navOpen}
  // Changed max-w-sm to max-w-xs below 
  className={`fixed left-0 top-0 z-50 flex h-full w-full max-w-xs flex-col border-r border-hairline bg-ink-raised shadow-2xl transition-transform duration-300 ${
    navOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
              <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
                <span className="font-label text-xs uppercase tracking-widest2 text-bone">Menu</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 font-label text-bone-dim transition-colors hover:text-accent"
                >
                  ✕
                </button>
              </div>

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

              <div className="border-t border-hairline px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="relative block h-10 w-10 shrink-0">
                    <Image src={LOGO_IMAGE} alt="" fill sizes="40px" className="object-contain" />
                  </span>
                  <p className="font-display text-base uppercase tracking-widest text-bone">Critics Archive</p>
                </div>
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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