"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { SOCIAL_LINKS, SocialIcon } from "@/components/social";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/sizing", label: "Sizing" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
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

      {/* Slide-out drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="site-nav-drawer"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-hairline bg-ink p-6 sm:w-80"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close menu"
                className="-mr-2 rounded-md p-2 text-bone transition-colors hover:text-accent"
              >
                <CloseIcon />
              </button>
            </div>

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

            <div className="mt-auto border-t border-hairline pt-6">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setNavOpen(false)}
                      className="font-label text-[11px] uppercase tracking-wide text-bone-dim transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-4">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="text-bone-dim transition-colors hover:text-accent"
                  >
                    <SocialIcon name={link.icon} />
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
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
