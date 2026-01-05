// Re-export types from database
export type { Bracelet, Charm } from '@/lib/db';

// Re-export database functions
export {
  getBracelets,
  getCharms,
  getCharmsByCategory,
  getCharmCategories,
  getBraceletById,
  getCharmById,
  getCharmsWithBackgrounds
} from '@/lib/db';

// Legacy exports for backward compatibility - these will fetch from database
import {
  getBracelets as fetchBracelets,
  getCharms as fetchCharms,
  getCharmCategories as fetchCharmCategories
} from '@/lib/db';

// Backward compatibility exports
export const bracelets = await fetchBracelets();
export const charms = await fetchCharms();
export const charmCategories = await fetchCharmCategories();

