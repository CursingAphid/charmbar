import { create } from 'zustand';
import { Bracelet, Charm, bracelets } from '@/data/products';

const DEFAULT_BRACELET_ID = 'bracelet-2'; // Gold Plated Chain
const defaultBracelet =
  bracelets.find((b) => b.id === DEFAULT_BRACELET_ID) ?? bracelets[0] ?? null;

export interface SelectedCharm {
  id: string; // Unique instance ID
  charm: Charm;
}

interface CartItem {
  bracelet: Bracelet;
  charms: SelectedCharm[]; // Now stores instances
  id: string;
}

interface StoreState {
  selectedBracelet: Bracelet | null;
  selectedCharms: SelectedCharm[];
  cart: CartItem[];
  
  // Actions
  setBracelet: (bracelet: Bracelet) => void;
  addCharm: (charm: Charm) => void;
  removeCharm: (instanceId: string) => void;
  reorderCharms: (newOrder: SelectedCharm[]) => void;
  addToCart: () => void;
  removeFromCart: (cartItemId: string) => void;
  clearSelection: () => void;
  getTotalPrice: () => number;
  getCartTotal: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
  selectedBracelet: defaultBracelet,
  selectedCharms: [],
  cart: [],

  setBracelet: (bracelet) => {
    set({ selectedBracelet: bracelet });
  },

  addCharm: (charm) => {
    const { selectedCharms } = get();
    if (selectedCharms.length >= 7) return;

    const newInstance: SelectedCharm = {
      id: `${charm.id}-${Date.now()}-${Math.random()}`,
      charm,
    };
    
    set({
      selectedCharms: [...selectedCharms, newInstance],
    });
  },

  removeCharm: (instanceId) => {
    const { selectedCharms } = get();
    set({
      selectedCharms: selectedCharms.filter((sc) => sc.id !== instanceId),
    });
  },

  reorderCharms: (newOrder) => {
    set({ selectedCharms: newOrder });
  },

  addToCart: () => {
    const { selectedBracelet, selectedCharms, cart } = get();
    if (!selectedBracelet) return;
    
    const cartItem: CartItem = {
      bracelet: selectedBracelet,
      charms: [...selectedCharms],
      id: `cart-${Date.now()}-${Math.random()}`,
    };
    
    set({ cart: [...cart, cartItem], selectedCharms: [] }); // Clear editor after adding to cart
  },

  removeFromCart: (cartItemId) => {
    const { cart } = get();
    set({ cart: cart.filter((item) => item.id !== cartItemId) });
  },

  clearSelection: () => {
    set({ selectedBracelet: defaultBracelet, selectedCharms: [] });
  },

  getTotalPrice: () => {
    const { selectedBracelet, selectedCharms } = get();
    if (!selectedBracelet) return 0;
    
    const braceletPrice = selectedBracelet.price;
    const charmsPrice = selectedCharms.reduce(
      (total, sc) => total + sc.charm.price,
      0
    );
    
    return braceletPrice + charmsPrice;
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      const braceletPrice = item.bracelet.price;
      const charmsPrice = item.charms.reduce(
        (sum, sc) => sum + sc.charm.price,
        0
      );
      return total + braceletPrice + charmsPrice;
    }, 0);
  },
}));

