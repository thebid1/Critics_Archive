"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryOptimized } from "@/lib/cloudinary";

/**
 * Product gallery — primary image with a thumbnail selector. All pieces
 * currently ship one primary shot; the thumbnail row appears automatically
 * once a product has multiple images ordered by `position`.
 */
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const src = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-raised">
        {src ? (
          <Image
            src={cloudinaryOptimized(src)}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="sr-only">No image available</span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              className={`relative h-20 w-16 shrink-0 overflow-hidden border transition-colors ${
                i === active ? "border-accent" : "border-hairline opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={cloudinaryOptimized(img, { width: 160 })} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}