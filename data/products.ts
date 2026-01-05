// Re-export types from database
export type { Bracelet, Charm } from '@/lib/db';

// Re-export database functions - this is the single source of truth
export {
  getBracelets,
  getCharms,
  getCharmsByCategory,
  getCharmCategories,
  getBraceletById,
  getCharmById,
  getCharmsWithBackgrounds
} from '@/lib/db';

