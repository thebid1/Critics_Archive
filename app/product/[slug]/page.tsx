import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/products";
import { PRODUCT_SIZE_CHART, SIZE_CHARTS, type SizeChart } from "@/lib/size-charts";
import { formatPrice } from "@/lib/format";
import Header from "@/components/Header";
import ProductGallery from "@/components/ProductGallery";
import ProductForm from "@/components/ProductForm";

// Read live product rows from Supabase at request time (no-store fetch must
// never be statically prerendered).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);
  if (!product) return { title: "Not found — CRITICS ARCHIVE" };
  return {
    title: `${product.name} — CRITICS ARCHIVE`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);
  if (!product) notFound();

  const chartName = PRODUCT_SIZE_CHART[product.slug];
  const chart = chartName ? SIZE_CHARTS[chartName] : undefined;
  const dropLabel = [product.dropName, product.season].filter(Boolean).join(" — ");

  return (
    <>
      <Header />
      <main>
        <section className="container-page py-10 sm:py-16">
          <Link
            href="/#shop"
            className="mb-10 inline-flex items-center gap-2 font-label text-xs uppercase tracking-widest2 text-bone-dim transition-colors hover:text-accent"
          >
            <span aria-hidden="true">←</span>
            Back to the drop
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col">
          <p className="eyebrow mb-3">{dropLabel || "The current drop"}</p>
          <h1 className="font-display text-3xl uppercase leading-none tracking-wide text-bone sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 font-label text-base text-accent">
            {formatPrice(product.currency, product.price)}
          </p>
          <p className="mt-2 font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
            {product.stock > 0 ? `${product.stock} units left` : "Sold out"}
          </p>
          <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-bone-dim">
            {product.description}
          </p>

          <div className="mt-8 border-t border-hairline pt-8">
            <ProductForm product={product} />
          </div>

          {chart && <SizeChartBlock chart={chart} />}

          <details className="group mt-6 border-t border-hairline pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-label text-xs uppercase tracking-widest2 text-bone">
              Product information
              <span aria-hidden="true" className="text-bone-dim transition-transform group-open:rotate-45">+</span>
            </summary>
            <ul className="mt-4 space-y-2 font-body text-sm text-bone-dim">
              <li>Composition — 100% Cotton</li>
              <li>Care — machine wash cold, inside out</li>
              <li>Fit — true to size</li>
            </ul>
          </details>

          <details className="group mt-6 border-t border-hairline pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-label text-xs uppercase tracking-widest2 text-bone">
              Shipping &amp; returns
              <span aria-hidden="true" className="text-bone-dim">+</span>
            </summary>
            <p className="mt-4 font-body text-sm leading-relaxed text-bone-dim">
              Shipping and taxes are calculated at checkout. For returns, see our
              Shipping &amp; Returns policy.
            </p>
          </details>
        </div>
      </div>
        </section>
      </main>
    </>
  );
}

function SizeChartBlock({ chart }: { chart: SizeChart }) {
  return (
    <details className="group mt-6 border-t border-hairline pt-5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-label text-xs uppercase tracking-widest2 text-bone">
        Size chart — {chart.label} ({chart.unit})
        <span aria-hidden="true" className="text-bone-dim transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-64 border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="py-2 pr-6 font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
                Size
              </th>
              {chart.columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="py-2 pr-6 font-label text-[11px] uppercase tracking-widest2 text-bone-dim"
                >
                  {col}
                  <span className="block text-[9px] text-bone-dim/60">({chart.unit})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.size} className="border-b border-hairline/50">
                <td className="py-2 pr-6 font-label text-xs text-bone">{row.size}</td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="py-2 pr-6 font-label text-xs text-bone-dim">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}