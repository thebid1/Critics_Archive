import Link from "next/link";
import Image from "next/image";

// Live Cloudinary asset (source of truth for the hero). `res.cloudinary.com` is
// allow-listed in next.config.js `images.remotePatterns`.
const HERO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858884/Hero_vivzsy.jpg";

export default function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden border-b border-hairline">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />

      <div className="container-page relative z-10 pb-14 sm:pb-20">
        <p className="eyebrow mb-4">Drop 001 — SS26</p>
        <h1
          aria-label="SWAG IS ART."
          className="text-left font-hero text-[18vw] font-black uppercase leading-[0.9] tracking-tight text-[#F4F3ED] sm:text-[13vw] lg:text-[8rem] xl:text-[10rem]"
        >
          Swag
          <br />
          Is art
          {/* Perfectly circular, heavily-weighted period to match the Black weight */}
          <span
            aria-hidden="true"
            className="ml-[0.05em] inline-block h-[0.18em] w-[0.18em] rounded-full bg-current align-baseline"
          />
        </h1>
        <Link
          href="/shop"
          className="mt-8 inline-flex bg-[#F4F3ED] px-6 py-3 font-label text-xs uppercase tracking-widest2 text-black transition-colors hover:bg-accent"
        >
          Shop the drop
        </Link>
      </div>
    </section>
  );
}
