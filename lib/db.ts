// API base URL - use environment variable or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Database interfaces
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
  category: string;
  image_data?: string; // Base64 encoded image data
  image_filename?: string;
  image_mimetype?: string;
  glb_data?: string; // Base64 encoded GLB data
  glb_filename?: string;
  glb_mimetype?: string;
  background_data?: string; // Base64 encoded background data
  background_filename?: string;
  background_mimetype?: string;
  created_at?: string;
  updated_at?: string;

  // Legacy compatibility fields
  image?: string;
  icon3d?: string;
  glbPath?: string;
  background?: string;
}

// Helper functions for image URLs
export function getCharmImageUrl(charm: Charm): string {
  if (charm.image_data) {
    // Use API endpoint for binary data
    return `/api/charms/${charm.id}/image`;
  }
  // Fallback to legacy image path
  return charm.image || '/images/placeholder.png';
}

export function getCharmBackgroundUrl(charm: Charm): string | null {
  if (charm.background_data) {
    // Use API endpoint for binary data
    return `/api/charms/${charm.id}/background-image`;
  }
  // Fallback to legacy background path
  return charm.background || null;
}

export function getCharmGlbUrl(charm: Charm): string | undefined {
  if (charm.glb_data) {
    // Use API endpoint for binary data
    return `/api/charms/${charm.id}/glb`;
  }
  // Fallback to legacy GLB path
  return charm.glbPath;
}

// Database functions
export async function getBracelets(): Promise<Bracelet[]> {
  try {
    // For now, return empty array since we're focusing on charms
    // TODO: Implement bracelet API endpoints if needed
    return [];
  } catch (error) {
    console.error('Error fetching bracelets:', error);
    return [];
  }
}

export async function getCharms(): Promise<Charm[]> {
  try {
    const data = await apiCall('/api/charms');
    return data || [];
  } catch (error) {
    console.error('Error fetching charms:', error);
    return [];
  }
}

export async function getCharmsByCategory(category: string): Promise<Charm[]> {
  try {
    if (category === 'All') {
      return getCharms();
    }

    const data = await apiCall(`/api/charms?category=${encodeURIComponent(category)}`);
    return data || [];
  } catch (error) {
    console.error('Error fetching charms by category:', error);
    return [];
  }
}

export async function getCharmCategories(): Promise<string[]> {
  try {
    // For now, return static categories since the API doesn't have a dedicated categories endpoint
    // TODO: Add categories endpoint if needed
    return ['All', 'Symbols', 'Nature'];
  } catch (error) {
    console.error('Error fetching charm categories:', error);
    return ['All'];
  }
}

export async function getBraceletById(id: string): Promise<Bracelet | null> {
  try {
    // TODO: Implement if needed
    return null;
  } catch (error) {
    console.error('Error fetching bracelet by ID:', error);
    return null;
  }
}

export async function getCharmById(id: string): Promise<Charm | null> {
  try {
    const data = await apiCall(`/api/charms/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching charm by ID:', error);
    return null;
  }
}

export async function getCharmsWithBackgrounds(): Promise<Charm[]> {
  try {
    // Get all charms and filter those with background data
    const charms = await getCharms();
    return charms.filter(charm => charm.background_data).slice(0, 3);
  } catch (error) {
    console.error('Error fetching charms with backgrounds:', error);
    return [];
  }
}
