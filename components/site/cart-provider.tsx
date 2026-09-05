"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { Product } from "@/lib/types";

/**
 * Shopping-cart state for the Medivyx shop.
 *
 * Lines persist in localStorage ("medivyx:cart") so a cart survives a
 * refresh. Prescription items CAN sit in the cart — the checkout flow then
 * requires a prescription upload and routes the order through pharmacist
 * review (pay on confirmation) instead of instant payment.
 */

export interface CartLine {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  packSize: string;
  prescriptionRequired: boolean;
  quantity: number;
}

const STORAGE_KEY = "medivyx:cart";
const MAX_QTY = 10;

interface State {
  lines: CartLine[];
  loaded: boolean;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "set-qty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "clear" }
  | { type: "replace"; lines: CartLine[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, loaded: true };
    case "add": {
      const existing = state.lines.find((l) => l.slug === action.line.slug);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.slug === action.line.slug
              ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + action.line.quantity) }
              : l
          ),
        };
      }
      return { ...state, lines: [...state.lines, action.line] };
    }
    case "set-qty":
      return {
        ...state,
        lines: state.lines
          .map((l) =>
            l.slug === action.slug
              ? { ...l, quantity: Math.max(0, Math.min(MAX_QTY, action.qty)) }
              : l
          )
          .filter((l) => l.quantity > 0),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };
    case "clear":
      return { ...state, lines: [] };
    case "replace":
      return { ...state, lines: action.lines };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  loaded: boolean;
  count: number;
  subtotal: number;
  hasPrescriptionItems: boolean;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  setQuantity: (slug: string, qty: number) => void;
  removeLine: (slug: string) => void;
  clearCart: () => void;
  reorder: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], loaded: false });
  const [cartOpen, setCartOpen] = useState(false);

  // Hydrate once on mount (client only — keeps SSR markup deterministic).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const lines = parsed
            .filter(
              (l): l is CartLine =>
                typeof l?.slug === "string" &&
                typeof l?.name === "string" &&
                typeof l?.price === "number" &&
                typeof l?.quantity === "number"
            )
            .map((l) => ({ ...l, quantity: Math.min(MAX_QTY, Math.max(1, l.quantity)) }));
          dispatch({ type: "hydrate", lines });
          return;
        }
      }
    } catch {
      // corrupted storage — start fresh
    }
    dispatch({ type: "hydrate", lines: [] });
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!state.loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // storage full/blocked — cart stays in memory for the session
    }
  }, [state.lines, state.loaded]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    dispatch({
      type: "add",
      line: {
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        packSize: product.packSize,
        prescriptionRequired: product.prescriptionRequired,
        quantity,
      },
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines: state.lines,
      loaded: state.loaded,
      count,
      subtotal,
      hasPrescriptionItems: state.lines.some((l) => l.prescriptionRequired),
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addToCart,
      setQuantity: (slug, qty) => dispatch({ type: "set-qty", slug, qty }),
      removeLine: (slug) => dispatch({ type: "remove", slug }),
      clearCart: () => dispatch({ type: "clear" }),
      reorder: (lines) => dispatch({ type: "replace", lines }),
    };
  }, [state, cartOpen, addToCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Format a KES amount for display (e.g. "KES 1,500"). */
export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}
