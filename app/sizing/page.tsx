import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SIZE_CHARTS, type SizeChart } from "@/lib/size-charts";

export const metadata: Metadata = {
  title: "Sizing — CRITICS ARCHIVE",
  description:
    "Garment measurements in inches. Tee, shorts, hoodie and sweatpants size charts. SWAG IS ART.",
};

// Ordered sections with storefront-facing names (the data labels are internal).
const SECTIONS: { key: string; title: string }[] = [
  { key: "tee", title: "Tee" },
  { key: "short", title: "Shorts" },
  { key: "hoodie", title: "Hoodie" },
  { key: "sweatpants", title: "Sweatpants" },
];

export default function SizingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Sizing</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Find your fit
          </h1>
          <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-bone-dim sm:text-base">
            All measurements are in inches and taken flat. If you&apos;re between
            sizes, size up for a looser fit.
          </p>

          <div className="mt-8 max-w-md border-l-2 border-accent pl-4">
            <p className="font-label text-[11px] uppercase tracking-widest2 text-accent">
              Special size order
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-bone-dim">
              Need a size we don&apos;t stock? Email{" "}
              <a
                href="mailto:support@criticsarchive.com"
                className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
              >
                support@criticsarchive.com
              </a>{" "}
              with your order reference and preferred size.
            </p>
          </div>

          <div className="mt-14 space-y-16">
            {SECTIONS.map(({ key, title }) => {
              const chart = SIZE_CHARTS[key];
              if (!chart) return null;
              return <SizeChartSection key={key} title={title} chart={chart} />;
            })}
          </div>

          <div className="mt-16 border-t border-hairline pt-8">
            <h2 className="font-display text-2xl uppercase text-bone">Scarf</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-bone-dim">
              One size (OS) — the scarf is a single, universal fit and has no size
              chart.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function SizeChartSection({ title, chart }: { title: string; chart: SizeChart }) {
  return (
    <section>
      <h2 className="font-display text-2xl uppercase text-bone sm:text-3xl">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="py-3 pr-6 font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
                Size
              </th>
              {chart.columns.map((col) => (
                <th
                  key={col}
                  className="py-3 pr-6 font-label text-[11px] uppercase tracking-widest2 text-bone-dim"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.size} className="border-b border-hairline">
                <td className="py-3 pr-6 font-label text-sm text-bone">{row.size}</td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="py-3 pr-6 font-body text-sm text-bone-dim">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
