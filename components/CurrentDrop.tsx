import { getActiveDrop, type Product } from "@/lib/products";
import { DROP_001 } from "@/lib/mock-products";
import ProductCard from "@/components/ProductCard";
import ScrollHint from "@/components/ScrollHint";

// Stage 2: the drop now renders LIVE rows from Supabase (published products,
// RLS-guarded). If the DB is unreachable at render time we fall back to the
// Stage 1 mock catalogue so the homepage stays up during a datastore outage.
// Stage 7: "current drop" = the ACTIVE drop's products (drops table), not all
// published products — /shop keeps showing everything.
async function getDrop(): Promise<{
  dropName: string;
  season: string | null;
  products: Product[];
}> {
  try {
    const { drop, products, season } = await getActiveDrop();
    if (drop && products.length > 0) {
      return { dropName: drop.name, season, products };
    }
    // No active drop yet — keep the page up with the mock catalogue.
    return { dropName: "Drop 001", season: "SS26", products: DROP_001 };
  } catch {
    return { dropName: "Drop 001", season: "SS26", products: DROP_001 };
  }
}

// 4–6 pieces get one clean row, no pagination, no categories.
// Desktop (lg+): side-by-side horizontal scroll track so pieces reveal as the
// user scrolls the row, with a "scroll to explore" hint and edge fades.
// Mobile/tablet: stacked two-column grid (unchanged).
export default async function CurrentDrop() {
  const { dropName, season, products } = await getDrop();
  const trackId = `drop-${dropName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-track`;

  return (
    <section id="shop" className="container-page py-20 sm:py-28">
      <div className="mb-10 flex items-end justify-between sm:mb-14">
        <div>
          <p className="eyebrow mb-3">The current drop</p>
          <h2 className="font-display text-4xl uppercase leading-none text-bone sm:text-5xl">
            {dropName}
          </h2>
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <p className="font-label text-xs uppercase tracking-widest2 text-bone-dim">
            {products.length} pieces{season ? ` — ${season}` : ""}
          </p>
          <ScrollHint targetId={trackId} />
        </div>
        <p className="hidden font-label text-xs uppercase tracking-widest2 text-bone-dim sm:block lg:hidden">
          {products.length} pieces{season ? ` — ${season}` : ""}
        </p>
      </div>

      {/* Desktop — horizontal side-by-side scroll */}
      <div className="relative hidden lg:block">
        <div
          id={trackId}
          tabIndex={0}
          role="region"
          aria-label={`${dropName} products — scroll horizontally`}
          className="scrollbar-slim flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 scroll-smooth"
        >
          {products.map((product, index) => (
            <div key={product.slug} className="w-[320px] shrink-0 snap-start xl:w-[350px] 2xl:w-[380px]">
              <ProductCard product={product} priority={index === 0} />
            </div>
          ))}
        </div>

        {/* Edge fades hint that more pieces sit off-screen */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent" />
      </div>

      {/* Mobile/tablet — stacked grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:hidden">
        {products.map((product, index) => (
          <ProductCard key={product.slug} product={product} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
