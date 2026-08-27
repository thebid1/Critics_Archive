import Image from "next/image";
import { cloudinaryPlaceholder } from "@/lib/cloudinary";

const TILE_IDS = ["01", "02", "03", "04", "05", "06"];

export default function CommunityStrip() {
  return (
    <section className="border-b border-hairline py-16 sm:py-20">
      <div className="container-page mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Follow the archive</p>
          <h2 className="font-display text-3xl uppercase leading-none text-bone sm:text-4xl">
            @criticsarchive
          </h2>
        </div>
        <a
          href="https://instagram.com/criticsarchive"
          target="_blank"
          rel="noreferrer"
          className="hidden font-label text-xs uppercase tracking-widest2 text-bone-dim transition-colors hover:text-accent sm:inline"
        >
          Follow on Instagram →
        </a>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {TILE_IDS.map((id) => (
          <div key={id} className="relative aspect-square overflow-hidden">
            <Image
              src={cloudinaryPlaceholder(`critics/community/${id}`, { width: 500 })}
              alt=""
              fill
              sizes="(min-width: 640px) 16vw, 33vw"
              className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
