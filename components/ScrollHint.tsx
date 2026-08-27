"use client";

// "Scroll to explore" indicator for the desktop horizontal product track.
// Clicking nudges the track along by ~80% of a viewport so the next card comes
// into view — desktop only (hidden below `lg`).
export default function ScrollHint({ targetId }: { targetId: string }) {
  function scrollTrack() {
    const track = document.getElementById(targetId);
    if (track) {
      track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
    }
  }

  return (
    <button
      type="button"
      onClick={scrollTrack}
      className="group inline-flex items-center gap-2 font-label text-xs uppercase tracking-widest2 text-bone-dim transition-colors hover:text-accent"
    >
      Scroll to explore
      <span
        aria-hidden="true"
        className="animate-nudge inline-block transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </button>
  );
}