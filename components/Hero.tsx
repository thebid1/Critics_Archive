"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cloudinaryOptimized } from "@/lib/cloudinary";

// Living slideshow assets for the hero. `res.cloudinary.com` is allow-listed in
// next.config.js `images.remotePatterns`.
//
// NOTE from the client list:
//  - the `criticslogo_wzshst.png` previously used as a slide is NOT a hero
//    slide — it's the brand logo, shown in the header only.
//  - `hero4_xaiv1b.heic` is HEIC, which browsers / Next Image can't render →
//    excluded until re-exported as jpg/png.
const HERO_IMAGES = [
  // Original full-bleed hero shot, retained as the first slide.
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787858884/Hero_vivzsy.jpg",
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787872065/hero2_kygbkb.jpg",
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787872066/hero3_fif9v5.jpg",
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787872065/hero5_vijxfy.jpg",
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787872065/hero6_e1h25h.jpg",
];

const SLIDE_INTERVAL_MS = 3000; // 3s per slide
const FADE_MS = 1200; // crossfade duration

export default function Hero() {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Auto-advance only when the user hasn't requested reduced motion.
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(
      () => setActive((curr) => (curr + 1) % HERO_IMAGES.length),
      SLIDE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden border-b border-hairline">
      {/* Crossfading image stack */}
      <div className="absolute inset-0">
        {HERO_IMAGES.map((src, i) => (
          <Image
            key={src}
            src={cloudinaryOptimized(src)}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            style={{ transitionDuration: `${FADE_MS}ms` }}
            className={`object-cover transition-opacity ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
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

      {/* Manual slide dots — also the navigation for reduced-motion users. */}
      <div className="absolute bottom-4 right-5 z-10 flex gap-2 sm:bottom-6">
        {HERO_IMAGES.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1} of ${HERO_IMAGES.length}`}
            aria-current={i === active}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === active ? "bg-bone" : "bg-bone/40 hover:bg-bone/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
