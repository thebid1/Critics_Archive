"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NIGERIA_STATES } from "@/lib/nigeria-states";

/**
 * Searchable Nigerian-state selector for checkout. A text search sits above a
 * scrollable list; click (or type to filter) and pick. Styled to match the
 * storefront's dark inputs.
 */
export default function StateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (state: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NIGERIA_STATES;
    return NIGERIA_STATES.filter((state) => state.toLowerCase().includes(q));
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function select(state: string) {
    onChange(state);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between border border-hairline bg-transparent px-3 py-3 font-body text-sm outline-none focus:border-accent"
      >
        <span className={value ? "text-bone" : "text-bone-dim"}>
          {value || "Select state"}
        </span>
        <span aria-hidden="true" className="text-bone-dim">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full border border-hairline bg-ink shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search states…"
            className="block w-full border-b border-hairline bg-ink px-3 py-2 font-body text-sm text-bone outline-none placeholder:text-bone-dim focus:border-accent"
          />
          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 font-body text-sm text-bone-dim">
                No state found
              </li>
            ) : (
              filtered.map((state) => (
                <li key={state}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={state === value}
                    onClick={() => select(state)}
                    className={`block w-full px-3 py-2 text-left font-body text-sm transition-colors ${
                      state === value
                        ? "bg-accent text-ink"
                        : "text-bone hover:bg-ink-raised"
                    }`}
                  >
                    {state}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}