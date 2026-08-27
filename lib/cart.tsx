"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/mock-products";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  /** True when the slide-out cart drawer is open. */
  isOpen: boolean;
  /** Sum of all quantities across items. */
  count: number;
  /** Grand total (price × qty) across all items. */
  total: number;
  /** Add a product (or bump its qty) and open the drawer. */
  addItem: (product: Product) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Stage 1 client-side cart shell. State is intentionally ephemeral (in-memory only):
// persistence/sync with Supabase and checkout are later stages (Stage 4+).
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === product.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === product.slug ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.image,
          qty: 1,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback(
    (slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug)),
    []
  );

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, qty: Math.max(0, qty) } : i))
    );
  }, []);

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
      open,
      close,
    };
  }, [items, isOpen, open, close, addItem, removeItem, setQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}