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

// Database interfaces
export interface Bracelet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  "openImage": string; // matching DB column "openImage"
  grayscale: boolean;
  color: string;
  material: string;
}

export interface Charm {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;

  // New schema fields
  image_url: string;
  glb_url: string;

  background_id?: number | string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// Helper functions for creating image URLs
export function getCharmImageUrl(charm: Charm): string {
  // Directly return the URL from Supabase Storage
  return charm.image_url || '';
}

export async function getCharmBackgroundUrl(charm: Charm): Promise<string | null> {
  if (charm.background_id) {
    const background = await getBackgroundById(String(charm.background_id));
    return background?.image_url || null;
  }
  return null;
}

export function getCharmGlbUrl(charm: Charm): string | undefined {
  return charm.glb_url || undefined;
}

// No cleanup needed for direct URLs
export function cleanupCharmGlbUrl(charmId: string): void {
  // no-op
}

// Background functions
// Background functions
export interface Background {
  id: string; // Changed to string/number flexibility or strict matches
  name: string;
  image_url: string;
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

// Function to download GLB file from URL
export function downloadCharmGlb(charm: Charm): void {
  if (charm.glb_url && typeof window !== 'undefined') {
    const link = document.createElement('a');
    link.href = charm.glb_url;
    link.download = `${charm.name}.glb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Database functions
export async function getBracelets(): Promise<Bracelet[]> {
  try {
    const { data, error } = await supabase
      .from('bracelets')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bracelets:', error);
    return [];
  }
}

export async function getCharms(): Promise<Charm[]> {
  try {
    const { data, error } = await supabase
      .from('charms')
      .select(`
        id, name, description, price, category, background_id, image_url, glb_url,
        charm_tags (
          tags (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform data to include tags array
    const charms: Charm[] = (data || []).map((charm: any) => ({
      ...charm,
      tags: charm.charm_tags?.map((ct: any) => ct.tags?.name).filter(Boolean) || []
    }));

    return charms;
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
      .select(`
        id, name, description, price, category, background_id, image_url, glb_url,
        charm_tags (
          tags (
            name
          )
        )
      `)
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
      .from('tags')
      .select('name')
      .order('name');

    if (error) throw error;

    // Get unique tag names
    const tags: string[] = data?.map((item: any) => item.name as string).filter(Boolean) || [];
    return ['All', ...tags];
  } catch (error) {
    console.error('Error fetching charm tags:', error);
    return ['All'];
  }
}

export async function getCharmsByTag(tagName: string): Promise<Charm[]> {
  try {
    if (tagName === 'All') {
      return getCharms();
    }

    // First get the tag ID
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (tagError || !tagData) {
      console.error('Tag not found:', tagName);
      return [];
    }

    const { data, error } = await supabase
      .from('charm_tags')
      .select(`
        charms (
          id, name, description, price, background_id, image_url, glb_url
        )
      `)
      .eq('tag_id', tagData.id);

    if (error) throw error;

    // Transform the data to match Charm interface
    const charms: Charm[] = data?.map((item: any) => ({
      ...item.charms,
      category: tagName,
    })) || [];

    return charms;
  } catch (error) {
    console.error('Error fetching charms by tag:', error);
    return [];
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
      .select(`
        id, name, description, price, category, background_id, image_url, glb_url,
        charm_tags (
          tags (
            name
          )
        )
      `)
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
      .select(`
        id, name, description, price, category, background_id, image_url, glb_url,
        charm_tags (
          tags (
            name
          )
        )
      `)
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
