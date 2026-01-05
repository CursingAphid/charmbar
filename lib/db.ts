import { createClient } from '@supabase/supabase-js';

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

// Helper functions for binary data handling
function byteaHexFromBase64(base64: string): string | null {
  if (!base64) return null;
  const buf = Buffer.from(base64, 'base64');
  return `\\x${buf.toString('hex')}`;
}

function bufferFromByteaField(value: string): Uint8Array {
  if (value.startsWith('\\x')) {
    // Handle PostgreSQL bytea hex format (\x...)
    const hexString = value.slice(2);
    const uint8Array = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      uint8Array[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return uint8Array;
  }

  // Handle base64 string
  if (typeof window === 'undefined') {
    // Server-side: use Buffer
    return new Uint8Array(Buffer.from(value, 'base64'));
  } else {
    // Client-side: use atob and Uint8Array
    const binaryString = atob(value);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
  }
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

// Helper functions for creating image URLs from binary data
export function getCharmImageUrl(charm: Charm): string {
  if (charm.image_data) {
    // Create data URL from binary data
    const uint8Array = bufferFromByteaField(charm.image_data);
    const base64 = uint8ArrayToBase64(uint8Array);
    return `data:${charm.image_mimetype};base64,${base64}`;
  }
  // Fallback to legacy image path
  return charm.image || '/images/placeholder.png';
}

export function getCharmBackgroundUrl(charm: Charm): string | null {
  if (charm.background_data) {
    // Create data URL from binary data
    const uint8Array = bufferFromByteaField(charm.background_data);
    const base64 = uint8ArrayToBase64(uint8Array);
    return `data:${charm.background_mimetype};base64,${base64}`;
  }
  // Fallback to legacy background path
  return charm.background || null;
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  if (typeof window === 'undefined') {
    // Server-side: use Buffer
    return Buffer.from(uint8Array).toString('base64');
  } else {
    // Client-side: use btoa
    let binary = '';
    uint8Array.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }
}

export function getCharmGlbUrl(charm: Charm): string | undefined {
  if (charm.glb_data) {
    // Create data URL from binary GLB data for 3D viewer
    const uint8Array = bufferFromByteaField(charm.glb_data);
    const base64 = uint8ArrayToBase64(uint8Array);
    return `data:${charm.glb_mimetype || 'model/gltf-binary'};base64,${base64}`;
  }
  // Fallback to legacy GLB path
  return charm.glbPath;
}

// Function to download GLB file from binary data
export function downloadCharmGlb(charm: Charm): void {
  if (charm.glb_data && typeof window !== 'undefined') {
    const uint8Array = bufferFromByteaField(charm.glb_data);
    const blob = new Blob([uint8Array], { type: charm.glb_mimetype || 'model/gltf-binary' });
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
    const { data, error } = await supabase
      .from('charms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching charms:', error);
      throw error;
    }

    console.log('✅ Retrieved', data?.length || 0, 'charms from database');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching charms:', error);
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
      .select('*')
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
      .select('*')
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
    console.log('🎨 getCharmsWithBackgrounds: Fetching charms with backgrounds...');
    const { data, error } = await supabase
      .from('charms')
      .select('*')
      .not('background_data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ getCharmsWithBackgrounds: Database error:', error);
      throw error;
    }

    console.log('✅ getCharmsWithBackgrounds: Found', data?.length || 0, 'charms with backgrounds:', data);
    return data || [];
  } catch (error) {
    console.error('❌ getCharmsWithBackgrounds: Error:', error);
    return [];
  }
}
