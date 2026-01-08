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
  charmPositions: Record<string, number>; // Maps charm instance ID to point index
  id: string;
  previewImage?: string;
}

interface StoreState {
  selectedBracelet: Bracelet | null;
  selectedCharms: SelectedCharm[];
  charmPositions: Record<string, number>; // Current charm positioning
  cart: CartItem[];
  editingCartItemId: string | null;

  // Actions
  setBracelet: (bracelet: Bracelet) => void;
  addCharm: (charm: Charm) => void;
  removeCharm: (id: string) => void;
  reorderCharms: (charms: SelectedCharm[]) => void;
  updateCharmPositions: (positions: Record<string, number>) => void;
  setEditingCartItemId: (cartItemId: string | null) => void;
  addToCart: (previewImage?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  reorderCartItemCharms: (cartItemId: string, newCharmOrder: SelectedCharm[]) => void;
  clearSelection: () => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getCartTotal: () => number;
  hasSelectedBracelet: () => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      selectedBracelet: null, // No default bracelet - must be selected from database
      selectedCharms: [],
      charmPositions: {},
      cart: [],
      editingCartItemId: null,

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

      updateCharmPositions: (positions) => {
        set({ charmPositions: positions });
      },

      setEditingCartItemId: (cartItemId) => {
        set({ editingCartItemId: cartItemId });
      },

      addToCart: (previewImage?: string) => {
        const { selectedBracelet, selectedCharms, charmPositions, cart, editingCartItemId } = get();
        if (!selectedBracelet) return;

        const isEditing = !!editingCartItemId && cart.some((c) => c.id === editingCartItemId);

        if (isEditing) {
          // Update existing cart item in-place
          const updatedCart = cart.map((item) =>
            item.id === editingCartItemId
              ? {
                ...item,
                bracelet: selectedBracelet,
                charms: [...selectedCharms],
                charmPositions: { ...charmPositions },
                previewImage, // Pass previewImage to existing item
              }
              : item
          );

          set({ cart: updatedCart, selectedCharms: [], charmPositions: {}, editingCartItemId: null });
          return;
        }

        const cartItem: CartItem = {
          bracelet: selectedBracelet,
          charms: [...selectedCharms],
          charmPositions: { ...charmPositions },
          id: `cart-${Date.now()}-${Math.random()}`,
          previewImage, // Pass previewImage to new item
        };

        set({ cart: [...cart, cartItem], selectedCharms: [], charmPositions: {}, editingCartItemId: null }); // Clear editor after adding to cart
      },

      removeFromCart: (cartItemId) => {
        const { cart, editingCartItemId } = get();
        set({
          cart: cart.filter((item) => item.id !== cartItemId),
          editingCartItemId: editingCartItemId === cartItemId ? null : editingCartItemId,
        });
      },

      reorderCartItemCharms: (cartItemId, newCharmOrder) => {
        const { cart } = get();
        const updatedCart = cart.map((item) =>
          item.id === cartItemId
            ? { ...item, charms: newCharmOrder }
            : item
        );
        set({ cart: updatedCart });
      },

      clearSelection: () => {
        set({ selectedBracelet: null, selectedCharms: [], charmPositions: {}, editingCartItemId: null });
      },

      clearCart: () => {
        set({ cart: [] });
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
        // Use localStorage for persistence on client (cookie size limits are too small for this state).
        if (typeof window !== 'undefined') {
          return {
            getItem: (name: string) => {
              const raw = window.localStorage.getItem(name);
              // IMPORTANT: createJSONStorage() handles JSON.parse/JSON.stringify.
              // We must return the raw string here.
              return raw;
            },
            setItem: (name: string, value: string) => {
              window.localStorage.setItem(name, value);
            },
            removeItem: (name: string) => {
              window.localStorage.removeItem(name);
            },
          };
        }
        // Fallback for SSR - use a no-op storage
        return {
          getItem: () => null,
          setItem: () => { },
          removeItem: () => { },
        };
      }),
      // Persist selection + cart so refresh doesn't wipe the user's basket.
      partialize: (state) => ({
        selectedBracelet: state.selectedBracelet,
        selectedCharms: state.selectedCharms,
        charmPositions: state.charmPositions,
        cart: state.cart,
        editingCartItemId: state.editingCartItemId,
      }),
    }
  )
);

