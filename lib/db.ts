import { createClient } from '@supabase/supabase-js';
import { bufferFromByteaField, byteaHexFromBase64 } from './utils';

// Initialize Supabase client with error checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  throw new Error('Supabase environment variables not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { bufferFromByteaField, byteaHexFromBase64 };

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
  background_id?: string; // Reference to background record (new API system)
  image_data?: string; // Base64 encoded image data
  image_filename?: string;
  image_mimetype?: string;
  glb_data?: string; // Base64 encoded GLB data
  glb_filename?: string;
  glb_mimetype?: string;
  background_data?: string; // Base64 encoded background data (legacy)
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

// Helper functions for creating image URLs from binary data
export function getCharmImageUrl(charm: Charm): string {
  if (charm.image_data) {
    // Create data URL from binary data
    const buffer = bufferFromByteaField(charm.image_data);
    const base64 = buffer.toString('base64');
    return `data:${charm.image_mimetype};base64,${base64}`;
  }
  // Prefer on-demand API fetch to avoid loading BYTEA blobs in list queries
  if (typeof window !== 'undefined') {
    return `/api/charm-image/${charm.id}`;
  }
  return '/images/placeholder.png';
}

export async function getCharmBackgroundUrl(charm: Charm): Promise<string | null> {
  // Check if charm has a background_id (new API system)
  if (charm.background_id) {
    // IMPORTANT: Don't pre-fetch here.
    // The returned URL will be requested by the browser when used as a CSS background,
    // so pre-fetching would cause a double request and make the UI feel laggy.
    return `/api/charm-background/${charm.id}`;
  }

  // Fallback to legacy background data (for backward compatibility)
  if (charm.background_data) {
    const buffer = bufferFromByteaField(charm.background_data);
    const base64 = buffer.toString('base64');
    return `data:${charm.background_mimetype || 'image/png'};base64,${base64}`;
  }

  // Final fallback to legacy background path
  return charm.background || null;
}

// Map charm IDs to local GLB files for hover effect
const getLocalGlbPath = (charmId: string): string | undefined => {
  const glbMappings: Record<string, string> = {
    'charm-1': '/images/charms/golden_ripple_charm.glb', // seashell1 -> golden ripple
    'charm-2': '/images/charms/half_moon.glb', // snowflake -> half moon
    'charm-3': '/images/charms/heart_with_wings.glb', // mother daughter heart -> heart with wings
    'charm-4': '/images/charms/tree_in_circle.glb', // tree in heart -> tree in circle
    'charm-5': '/images/charms/golden_ripple_charm.glb', // golden ripple -> golden ripple
    'charm-6': '/images/charms/tree_in_circle.glb', // tree in circle -> tree in circle
    'charm-7': '/images/charms/half_moon.glb', // half moon -> half moon
  };
  return glbMappings[charmId];
};

// Cache for GLB blob URLs to avoid repeated conversions
const glbCache = new Map<string, string>();

export function getCharmGlbUrl(charm: Charm): string | undefined {
  if (charm.glb_data) {
    // Use cached blob URL if available
    if (glbCache.has(charm.id)) {
      return glbCache.get(charm.id);
    }

    try {
      // Convert bytea hex data to Buffer, then create blob URL (much more efficient than data URLs)
      const buffer = bufferFromByteaField(charm.glb_data);
      const mimeType = charm.glb_mimetype || 'model/gltf-binary';

      // Create blob and blob URL for better performance
      if (typeof window !== 'undefined') {
        const uint8Array = new Uint8Array(buffer);
        const blob = new Blob([uint8Array], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        glbCache.set(charm.id, blobUrl);
        return blobUrl;
      }

      // Fallback to data URL for server-side rendering
      const base64 = buffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting GLB data for charm:', charm.id, error);
      // Fallback to local file
      return getLocalGlbPath(charm.id);
    }
  }

  // Prefer on-demand API fetch (keeps list queries small)
  if (typeof window !== 'undefined') {
    return `/api/charm-glb/${charm.id}`;
  }
  return getLocalGlbPath(charm.id);
}

// Function to clean up blob URLs when component unmounts
export function cleanupCharmGlbUrl(charmId: string): void {
  if (glbCache.has(charmId)) {
    const blobUrl = glbCache.get(charmId);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    glbCache.delete(charmId);
  }
}

// Background functions
export interface Background {
  id: string;
  name: string;
  image_data?: string;
  image_filename?: string;
  image_mimetype?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getBackgrounds(): Promise<Background[]> {
  try {
    const { data, error } = await supabase
      .from('backgrounds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching backgrounds:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBackgrounds:', error);
    return [];
  }
}

export async function getBackgroundById(id: string): Promise<Background | null> {
  try {
    const { data, error } = await supabase
      .from('backgrounds')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching background:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBackgroundById:', error);
    return null;
  }
}

// Function to download GLB file from binary data
export function downloadCharmGlb(charm: Charm): void {
  if (charm.glb_data && typeof window !== 'undefined') {
    const buffer = bufferFromByteaField(charm.glb_data);
    const blob = new Blob([new Uint8Array(buffer)], { type: charm.glb_mimetype || 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = charm.glb_filename || 'model.glb';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
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
    // IMPORTANT: Do NOT select BYTEA blobs (image_data/glb_data) here.
    // They can be huge and cause PostgREST statement timeouts.
    // Images/GLBs are fetched on-demand via /api/charm-image/:id and /api/charm-glb/:id.
    const { data, error } = await supabase
      .from('charms')
      .select('id, name, description, price, category, background_id')
      .order('created_at', { ascending: false })
      .limit(10); // Add limit to prevent large result sets

    if (error) throw error;
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

    const { data, error } = await supabase
      .from('charms')
      .select('id, name, description, price, category, background_id')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching charms by category:', error);
    return [];
  }
}

export async function getCharmCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('charms')
      .select('category')
      .order('category');

    if (error) throw error;

    // Get unique categories
    const categories: string[] = Array.from(new Set(data?.map((item: any) => item.category as string).filter(Boolean) || []));
    return ['All', ...categories];
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
    const { data, error } = await supabase
      .from('charms')
      .select('id, name, description, price, category, background_id')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching charm by ID:', error);
    return null;
  }
}

export async function getCharmsWithBackgrounds(): Promise<Charm[]> {
  try {
    // Simplify query - just get charms that have background_id for now
    const { data, error } = await supabase
      .from('charms')
      .select('id, name, description, price, category, background_id')
      .not('background_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching charms with backgrounds:', error);
    return [];
  }
}
