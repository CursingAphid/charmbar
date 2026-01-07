import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bufferFromByteaField } from '@/lib/utils';

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
    console.log(`[API] Fetching GLB for charmId: "${charmId}"`);

    const { data, error } = await supabase
      .from('charms')
      .select('id, glb_filename, glb_mimetype, glb_data')
      .eq('id', charmId)
      .not('glb_data', 'is', null)
      .single();

    if (error) {
      console.error(`[API] Supabase error for ${charmId}:`, error);
      return NextResponse.json({ error: 'Charm GLB not found', details: error.message }, { status: 404 });
    }

    console.log(`[API] Successfully found GLB for ${charmId}, filename: ${data.glb_filename}`);

    const buffer = bufferFromByteaField(data.glb_data);
    const uint8Array = new Uint8Array(buffer);

    const headers = new Headers();
    headers.set('Content-Type', data.glb_mimetype || 'model/gltf-binary');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (data.glb_filename) {
      headers.set('Content-Disposition', `inline; filename="${data.glb_filename}"`);
    }

    return new NextResponse(uint8Array, { status: 200, headers });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch charm GLB' }, { status: 500 });
  }
}


