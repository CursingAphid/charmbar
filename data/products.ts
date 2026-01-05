export interface Bracelet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  openImage?: string;
  grayscale?: boolean;
  color: string;
  material: string;
}

export interface Charm {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  icon3d?: string; // Icon name from react-3d-icons
  glbPath?: string; // Path to GLB 3D model file
  background?: string; // Path to background image
}

export const bracelets: Bracelet[] = [
  {
    id: 'bracelet-1',
    name: 'Classic Silver Chain',
    description: 'Elegant silver chain bracelet perfect for any occasion',
    price: 29.99,
    image: '/images/bracelets/bracelet_silver.png',
    openImage: '/images/bracelets/bracelet_open.png',
    grayscale: true,
    color: 'Silver',
    material: 'Sterling Silver',
  },
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
  },
];

export const charms: Charm[] = [
  {
    id: 'charm-1',
    name: 'Heart with Wings',
    description: 'Classic heart with wings charm',
    price: 3.99,
    image: '/images/charms/heart_with_wings.png',
    category: 'Symbols',
    glbPath: '/images/charms/heart_with_wings.glb',
    background: '/images/charms/backgrounds/heart_with_wings_background.png',
  },
  {
    id: 'charm-2',
    name: 'Snowflake',
    description: 'Delicate snowflake charm',
    price: 3.99,
    image: '/images/charms/snowflake.png',
    category: 'Nature',
    icon3d: 'Snowflake',
  },
  {
    id: 'charm-3',
    name: 'Mother & Daughter Heart',
    description: 'Beautiful mother and daughter heart charm',
    price: 3.99,
    image: '/images/charms/mother_daughter_heart.png',
    category: 'Symbols',
    icon3d: 'Heart', // Using Heart icon as placeholder
  },
  {
    id: 'charm-4',
    name: 'Tree in Heart',
    description: 'Tree of life in heart charm',
    price: 3.99,
    image: '/images/charms/tree_in_heart.png',
    category: 'Nature',
    icon3d: 'Tree', // Using Tree icon if available, or Leaf
  },
  {
    id: 'charm-5',
    name: 'Golden Ripple',
    description: 'Elegant golden ripple charm with flowing waves',
    price: 3.99,
    image: '/images/charms/golden_ripple_charm.png',
    category: 'Nature',
    glbPath: '/images/charms/golden_ripple_charm.glb',
    background: '/images/charms/backgrounds/golden_ripple_ring_background.png',
  },
  {
    id: 'charm-6',
    name: 'Tree in Circle',
    description: 'Beautiful tree encircled by elegant design',
    price: 3.99,
    image: '/images/charms/tree_in_circle.png',
    category: 'Nature',
    glbPath: '/images/charms/tree_in_circle.glb',
    background: '/images/charms/backgrounds/tree_in_circle_background.png',
  },
  {
    id: 'charm-7',
    name: 'Half Moon',
    description: 'Mystical half moon charm with celestial beauty',
    price: 3.99,
    image: '/images/charms/half_moon.png',
    category: 'Nature',
    glbPath: '/images/charms/half_moon.glb',
    background: '/images/charms/backgrounds/half_moon_background.png',
  },
];

export const charmCategories = [
  'All',
  'Symbols',
  'Nature',
];

