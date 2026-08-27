import Image from "next/image";
import { cloudinaryPlaceholder } from "@/lib/cloudinary";

// Atmosphere / identity only — deliberately not another shopping surface (per brief §3E).
export default function Editorial() {
  return (
    <section className="relative grid min-h-[70vh] grid-cols-1 border-b border-hairline lg:grid-cols-2">
      <div className="relative order-2 aspect-square lg:order-1 lg:aspect-auto">
        <Image
          src={cloudinaryPlaceholder("critics/campaign/editorial-01", { width: 1200 })}
          alt="CRITICS ARCHIVE editorial campaign imagery"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="order-1 flex flex-col justify-center bg-ink-raised px-8 py-16 sm:px-14 lg:order-2 lg:px-16">
        <p className="eyebrow mb-4">The archive — 001</p>
        <h2 className="font-display text-4xl uppercase leading-[0.9] text-bone sm:text-5xl">
          This is where
          <br />
          it begins.
        </h2>
        <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-bone-dim">
          Every archive starts somewhere. Drop 001 is the first entry — four pieces, one
          conviction. The catalogue will grow. The intention won&apos;t change.
        </p>
        <p className="mt-10 font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
          — Critics Archive, est. 2026
        </p>
      </div>
    </section>
  );
}
