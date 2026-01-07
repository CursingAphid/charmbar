import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bufferFromByteaField } from '@/lib/utils';

// Map charm IDs to local GLB files for fallback
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const charmId = resolvedParams?.id;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('charms')
      .select('glb_data, glb_mimetype')
      .eq('id', charmId)
      .single();

    if (error || !data?.glb_data) {
      // Fallback to local GLB file
      const localGlbPath = getLocalGlbPath(charmId);
      if (localGlbPath) {
        try {
          // Try to serve local file
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), 'public', localGlbPath);
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const headers = new Headers();
            headers.set('Content-Type', 'model/gltf-binary');
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            return new NextResponse(fileBuffer, { status: 200, headers });
          }
        } catch (localError) {
          console.error('Error serving local GLB file:', localError);
        }
      }
      return NextResponse.json({ error: 'Charm GLB not found' }, { status: 404 });
    }

    const buffer = bufferFromByteaField(data.glb_data);
    const uint8Array = new Uint8Array(buffer);

    const headers = new Headers();
    headers.set('Content-Type', data.glb_mimetype || 'model/gltf-binary');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(uint8Array, { status: 200, headers });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch charm GLB' }, { status: 500 });
  }
}


