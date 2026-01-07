import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Bracelet, Charm } from '@/lib/db';

// Default bracelet - will be replaced with database-driven bracelet selection
// For now keeping minimal data structure until bracelet selection is implemented
const defaultBracelet: Bracelet = {
  id: 'bracelet-2',
  name: 'Gold Plated Chain',
  description: 'Luxurious gold-plated chain with timeless appeal',
  price: 34.99,
  image: '', // Will be loaded from database API
  openImage: '', // Will be loaded from database API
  grayscale: false,
  color: 'Gold',
  material: 'Gold Plated'
};

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
  hasSelectedBracelet: () => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
  selectedBracelet: null, // No default bracelet - must be selected from database
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
    set({ selectedBracelet: null, selectedCharms: [] });
  },

  hasSelectedBracelet: () => {
    return get().selectedBracelet !== null;
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
}),
    {
      name: 'charm-selection-storage',
      storage: createJSONStorage(() => {
        // Use cookies for persistence on client, fallback to localStorage for SSR
        if (typeof window !== 'undefined') {
          return {
            getItem: (name: string) => {
              const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(name + '='))
                ?.split('=')[1];
              return value ? JSON.parse(decodeURIComponent(value)) : null;
            },
            setItem: (name: string, value: string) => {
              document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
            },
            removeItem: (name: string) => {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            },
          };
        }
        // Fallback for SSR - use a no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist the charm selection state, not the cart
      partialize: (state) => ({
        selectedBracelet: state.selectedBracelet,
        selectedCharms: state.selectedCharms,
      }),
    }
  )
);

