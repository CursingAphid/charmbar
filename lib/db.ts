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

function bufferFromByteaField(value: string): Buffer {
  if (value.startsWith('\\x')) {
    const raw = Buffer.from(value.slice(2), 'hex');
    const asText = raw.toString('utf8');
    // Check if it's base64 text stored as bytes
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(asText) && asText.length % 4 === 0) {
      return Buffer.from(asText, 'base64');
    }
    return raw;
  }
  return Buffer.from(value, 'base64');
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
    const buffer = bufferFromByteaField(charm.image_data);
    const base64 = buffer.toString('base64');
    return `data:${charm.image_mimetype};base64,${base64}`;
  }
  // Fallback to legacy image path
  return charm.image || '/images/placeholder.png';
}

export function getCharmBackgroundUrl(charm: Charm): string | null {
  if (charm.background_data) {
    // Create data URL from binary data
    const buffer = bufferFromByteaField(charm.background_data);
    const base64 = buffer.toString('base64');
    return `data:${charm.background_mimetype};base64,${base64}`;
  }
  // Fallback to legacy background path
  return charm.background || null;
}

export function getCharmGlbUrl(charm: Charm): string | undefined {
  if (charm.glb_data) {
    // For GLB files, we'll need to create a download URL
    // This is handled differently - return the data for download
    return undefined; // GLB download is handled separately
  }
  // Fallback to legacy GLB path
  return charm.glbPath;
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

// Debug function to check database connectivity and table existence
export async function debugDatabaseConnection() {
  try {
    console.log('🔧 Debug: Checking database connection...');

    // Check if we can connect at all - try a simple query
    const { data: connectionTest, error: connectionError } = await supabase
      .from('charms')
      .select('id', { count: 'exact', head: true });

    console.log('🔧 Debug: Connection test:', { count: connectionTest, error: connectionError });

    // Try to get table info by selecting just id
    console.log('🔧 Debug: Checking if table exists and has data...');
    const { data: idCheck, error: idError } = await supabase
      .from('charms')
      .select('id')
      .limit(1);

    console.log('🔧 Debug: ID check result:', { data: idCheck, error: idError });

    // Try different table names in case of naming issues
    const tableNames = ['charms', 'Charm', 'Charms', 'charm'];

    for (const tableName of tableNames) {
      console.log(`🔧 Debug: Trying table name "${tableName}"...`);
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);

        if (!tableError && tableData) {
          console.log(`✅ Found table "${tableName}" with ${tableData.length} records!`);
          if (tableData.length > 0) {
            console.log(`🔧 Debug: Sample record from "${tableName}":`, tableData[0]);
            console.log(`🔧 Debug: Columns:`, Object.keys(tableData[0]));
          }
          break;
        } else {
          console.log(`❌ Table "${tableName}" not found or empty:`, tableError?.message);
        }
      } catch (err) {
        console.log(`❌ Error checking table "${tableName}":`, err.message);
      }
    }

    // Try full select on the expected table
    const { data, error } = await supabase
      .from('charms')
      .select('*')
      .limit(10);

    console.log('🔧 Debug: Full select result on "charms" table:', { data, error });

    if (error) {
      console.error('🔧 Debug: Query failed with error:', error);
      console.error('🔧 Debug: Error code:', error.code);
      console.error('🔧 Debug: Error message:', error.message);
    } else {
      console.log('🔧 Debug: Query succeeded, found', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('🔧 Debug: Sample record keys:', Object.keys(data[0]));
        console.log('🔧 Debug: Sample record:', data[0]);
      }
    }

    return { data, error };
  } catch (error) {
    console.error('🔧 Debug: Debug function failed:', error);
    return { data: null, error };
  }
}
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
    console.log('🔍 getCharms: Fetching charms from database...');
    console.log('🔍 getCharms: Supabase client available:', !!supabase);

    // First, let's try a simple count query
    const { count, error: countError } = await supabase
      .from('charms')
      .select('*', { count: 'exact', head: true });

    console.log('🔍 getCharms: Count query result:', { count, error: countError });

    // Try a different approach - select without ordering first
    console.log('🔍 getCharms: Trying simple select...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('charms')
      .select('*');

    console.log('🔍 getCharms: Simple query result:', { data: simpleData, error: simpleError });

    // Now try the full query
    const { data, error } = await supabase
      .from('charms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ getCharms: Database error:', error);
      console.error('❌ getCharms: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Try without ordering if that might be the issue
      console.log('🔍 getCharms: Trying without ordering...');
      const { data: unorderedData, error: unorderedError } = await supabase
        .from('charms')
        .select('*');

      console.log('🔍 getCharms: Unordered query:', { data: unorderedData, error: unorderedError });
      throw error;
    }

    console.log('✅ getCharms: Retrieved', data?.length || 0, 'charms');
    console.log('✅ getCharms: Raw data:', data);
    console.log('✅ getCharms: First charm (if any):', data?.[0]);

    return data || [];
  } catch (error) {
    console.error('❌ getCharms: Error fetching charms:', error);
    console.error('❌ getCharms: Full error object:', error);
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
