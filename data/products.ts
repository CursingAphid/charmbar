// Simple static data without 3D models for now
export const bracelets = [
  {
    id: 'bracelet-2',
    name: 'Gold Plated Chain',
    description: 'Luxurious gold-plated chain with timeless appeal',
    price: 34.99,
    image: '/images/bracelets/bracelet_gold.png',
    openImage: '/images/bracelets/bracelet_open.png',
    grayscale: false,
    color: 'Gold',
    material: 'Gold Plated',
  }
];

export const charms = [
  {
    id: 'charm-1',
    name: 'Heart with Wings',
    description: 'Classic heart with wings charm',
    price: 3.99,
    category: 'Symbols',
    image: '/images/charms/heart_with_wings.png',
    background: '/images/charms/backgrounds/heart_with_wings_background.png',
    // No icon3d or glbPath to avoid 3D model issues
  },
  {
    id: 'charm-2',
    name: 'Snowflake',
    description: 'Delicate snowflake charm',
    price: 3.99,
    category: 'Nature',
    image: '/images/charms/snowflake.png',
    // No background
  },
  {
    id: 'charm-3',
    name: 'Mother & Daughter Heart',
    description: 'Beautiful mother and daughter heart charm',
    price: 3.99,
    category: 'Symbols',
    image: '/images/charms/mother_daughter_heart.png',
    // No background
  },
  {
    id: 'charm-4',
    name: 'Tree in Heart',
    description: 'Tree of life in heart charm',
    price: 3.99,
    category: 'Nature',
    image: '/images/charms/tree_in_heart.png',
    // No background
  },
  {
    id: 'charm-5',
    name: 'Golden Ripple',
    description: 'Elegant golden ripple charm',
    price: 3.99,
    category: 'Nature',
    image: '/images/charms/golden_ripple_charm.png',
    background: '/images/charms/backgrounds/golden_ripple_ring_background.png',
    // No icon3d or glbPath to avoid 3D model issues
  },
  {
    id: 'charm-6',
    name: 'Tree in Circle',
    description: 'Beautiful tree encircled by elegant design',
    price: 3.99,
    category: 'Nature',
    image: '/images/charms/tree_in_circle.png',
    background: '/images/charms/backgrounds/tree_in_circle_background.png',
    // No icon3d or glbPath to avoid 3D model issues
  },
  {
    id: 'charm-7',
    name: 'Half Moon',
    description: 'Mystical half moon charm',
    price: 3.99,
    category: 'Nature',
    image: '/images/charms/half_moon.png',
    background: '/images/charms/backgrounds/half_moon_background.png',
    // No icon3d or glbPath to avoid 3D model issues
  }
];

export const charmCategories = ['All', 'Symbols', 'Nature'];

// Re-export types from database (for compatibility)
export type { Bracelet, Charm } from '@/lib/db';

