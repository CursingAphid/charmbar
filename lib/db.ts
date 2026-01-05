import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily to avoid build-time errors
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
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
  image: string;
  category: string;
  icon3d?: string;
  glbPath?: string;
  background?: string;
}

// Database functions
export async function getBracelets(): Promise<Bracelet[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('bracelets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bracelets:', error);
    return [];
  }
}

export async function getCharms(): Promise<Charm[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('charms')
      .select('*')
      .order('created_at', { ascending: false });

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

    const client = getSupabaseClient();
    const { data, error } = await client
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
    const client = getSupabaseClient();
    const { data, error } = await client
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
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('bracelets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bracelet by ID:', error);
    return null;
  }
}

export async function getCharmById(id: string): Promise<Charm | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
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
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('charms')
      .select('*')
      .not('background', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching charms with backgrounds:', error);
    return [];
  }
}
