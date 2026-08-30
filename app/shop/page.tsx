import type { Metadata } from "next";
import { listPublishedProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shop — CRITICS ARCHIVE",
  description: "The current drop. SWAG IS ART — Drop 001, SS26.",
};

// Client request: the whole drop shows at once (no pagination) — the full
// current catalogue renders on one page, and each piece opens its product page.
// force-dynamic: always read live rows from Supabase at request time (the
// no-store fetch must never be statically prerendered).
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await listPublishedProducts();

  return (
    <>
      <Header />
      <main>
        <section id="drop-001" className="container-page py-16 sm:py-24">
          <div className="mb-10 flex items-end justify-between sm:mb-14">
            <div>
              <p className="eyebrow mb-3">The current drop</p>
              <h1 className="font-display text-4xl uppercase leading-none text-bone sm:text-5xl">
                Drop 001
              </h1>
            </div>
            <p className="hidden font-label text-xs uppercase tracking-widest2 text-bone-dim sm:block">
              {products.length} pieces — SS26
            </p>
          </div>

          {products.length === 0 ? (
            <p className="font-body text-sm text-bone-dim">
              No pieces here yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}