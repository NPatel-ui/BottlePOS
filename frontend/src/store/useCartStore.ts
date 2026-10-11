import { create } from 'zustand';
import type { Product, CartItem } from '../types/backend';

interface CartState {
  items: CartItem[];
  taxRate: number;
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  taxRate: 0.0825,

  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [...state.items, { ...product, cartItemId: crypto.randomUUID(), quantity: 1 }],
      };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + (Number(item.bottle_price) * item.quantity), 0);
  },

  getTaxAmount: () => {
    return get().getSubtotal() * get().taxRate;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxAmount();
  },
}));
