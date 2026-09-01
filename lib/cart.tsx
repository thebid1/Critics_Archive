"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";

export type CartItem = {
  /** Composite identity: `slug` alone for size-less adds, `slug::size` when sized. */
  key: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  size: string; // "" when the piece is single-size
  qty: number;
  /** Hard ceiling for qty — the available stock for this size at add time. */
  maxQty: number;
};

type CartContextValue = {
  items: CartItem[];
  /** True when the slide-out cart drawer is open. */
  isOpen: boolean;
  /** Sum of all quantities across items. */
  count: number;
  /** Grand total (price × qty) across all items. */
  total: number;
  /**
   * Add a product in an optional size. `openDrawer` (default true) controls
   * whether the cart drawer slides out — Buy Now passes false so the user
   * lands straight on /checkout instead. `maxQty` sets the stock ceiling for
   * the line (default 99 when unknown).
   */
  addItem: (product: Product, size?: string, openDrawer?: boolean, maxQty?: number) => void;
  removeItem: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  /** Empties the bag — called after a successful order (Stage 5). */
  clearCart: () => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Persistence
//
// The cart holds only product refs / size / qty — no PII — so localStorage is a
// safe + appropriate store ("no localStorage of SENSITIVE data" per agents.md;
// emails/addresses stay server-side only in Stage 5). Everything is defended:
// guarded reads, shape validation, try/catch so a corrupt/quota-blocked store
// never breaks the app.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "critics-archive:cart";
const DEFAULT_MAX = 99;

function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === "string" &&
    v.key.length > 0 &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.size === "string" &&
    typeof v.price === "number" &&
    v.price >= 0 &&
    typeof v.qty === "number" &&
    v.qty >= 1 &&
    (typeof v.maxQty === "number" ? v.maxQty >= 1 : true)
  );
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidCartItem)
      .map((i) => ({ ...i, maxQty: i.maxQty ?? DEFAULT_MAX }));
  } catch {
    return [];
  }
}

function writeCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode / quota) — cart stays in-memory */
  }
}

  export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage only after mount — avoids hydration mismatches
  // (server renders the empty cart, client swaps in the persisted one).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = readCartFromStorage();
    if (stored.length > 0) setItems(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCartToStorage(items);
  }, [items, hydrated]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (product: Product, size = "", openDrawer = true, maxQty = DEFAULT_MAX) => {
      const safeMax = Math.max(1, Math.floor(maxQty));
      const key = size ? `${product.slug}::${size}` : product.slug;
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key ? { ...i, qty: Math.min(i.qty + 1, i.maxQty) } : i
          );
        }
        return [
          ...prev,
          {
            key,
            slug: product.slug,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.image,
            size,
            qty: 1,
            maxQty: safeMax,
          },
        ];
      });
      if (openDrawer) setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback(
    (key: string) => setItems((prev) => prev.filter((i) => i.key !== key)),
    []
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.key !== key) return [i];
        if (qty <= 0) return []; // 0 = remove the line
        return [{ ...i, qty: Math.min(qty, i.maxQty) }];
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return {
      items,
      isOpen,
      count,
      total,
      addItem,
      removeItem,
      setQty,
      clearCart,
      open,
      close,
    };
  }, [items, isOpen, open, close, addItem, removeItem, setQty, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}