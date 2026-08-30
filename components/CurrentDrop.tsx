import { listPublishedProducts, type Product } from "@/lib/products";
import { DROP_001 } from "@/lib/mock-products";
import ProductCard from "@/components/ProductCard";
import ScrollHint from "@/components/ScrollHint";

// Stage 2: the drop now renders LIVE rows from Supabase (published products,
// RLS-guarded). If the DB is unreachable at render time we fall back to the
// Stage 1 mock catalogue so the homepage stays up during a datastore outage.
async function getProducts(): Promise<Product[]> {
  try {
    return await listPublishedProducts();
  } catch {
    return DROP_001;
  }
}

// 4–6 pieces get one clean row, no pagination, no categories.
// Desktop (lg+): side-by-side horizontal scroll track so pieces reveal as the user
// scrolls the row, with a "scroll to explore" hint and edge fades.
// Mobile/tablet: stacked two-column grid (unchanged).
export default async function CurrentDrop() {
  const products = await getProducts();

  return (
    <section id="shop" className="container-page py-20 sm:py-28">
      <div className="mb-10 flex items-end justify-between sm:mb-14">
        <div>
          <p className="eyebrow mb-3">The current drop</p>
          <h2 className="font-display text-4xl uppercase leading-none text-bone sm:text-5xl">
            Drop 001
          </h2>
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <p className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
            {products.length} pieces — SS26
          </p>
          <ScrollHint targetId="drop-001-track" />
        </div>
        <p className="hidden font-label text-xs uppercase tracking-widest2 text-bone-dim sm:block lg:hidden">
          {products.length} pieces — SS26
        </p>
      </div>

      {/* Desktop — horizontal side-by-side scroll */}
      <div className="relative hidden lg:block">
        <div
          id="drop-001-track"
          tabIndex={0}
          role="region"
          aria-label="Drop 001 products — scroll horizontally"
          className="scrollbar-slim flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 scroll-smooth"
        >
          {products.map((product) => (
            <div key={product.slug} className="w-[320px] shrink-0 snap-start xl:w-[350px] 2xl:w-[380px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Edge fades hint that more pieces sit off-screen */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent" />
      </div>

      {/* Mobile/tablet — stacked grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:hidden">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
