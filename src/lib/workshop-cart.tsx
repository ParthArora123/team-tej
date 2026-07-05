import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { programId: string; silverSeat: boolean };

type Ctx = {
  items: CartItem[];
  add: (programId: string, silverSeat?: boolean) => void;
  remove: (programId: string) => void;
  toggleSilver: (programId: string) => void;
  clear: () => void;
  has: (programId: string) => boolean;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "ttj:workshop-cart:v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add: Ctx["add"] = (programId, silverSeat = false) =>
    setItems((s) => (s.some((i) => i.programId === programId) ? s : [...s, { programId, silverSeat }]));
  const remove: Ctx["remove"] = (programId) => setItems((s) => s.filter((i) => i.programId !== programId));
  const toggleSilver: Ctx["toggleSilver"] = (programId) =>
    setItems((s) => s.map((i) => (i.programId === programId ? { ...i, silverSeat: !i.silverSeat } : i)));
  const clear = () => setItems([]);
  const has = (programId: string) => items.some((i) => i.programId === programId);

  return (
    <CartContext.Provider value={{ items, add, remove, toggleSilver, clear, has, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
