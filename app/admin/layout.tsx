import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/guard";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

/**
 * Admin shell — every /admin page is gated here, server-side, per request
 * (allow-listed session check). The storefront layout/formatters never run here.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { email } = await requireAdmin();

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-bold uppercase tracking-wide">
                Critics&nbsp;Archive
              </span>
              <span className="hidden text-xs text-gray-400 sm:inline">Admin</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs text-gray-400 md:inline">{email}</span>
              <SignOutButton />
            </div>
          </div>
          <nav className="mt-3 flex items-center gap-1 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}