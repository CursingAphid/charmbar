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
    const { data, error } = await supabase
      .from('charms')
      .select('glb_data, glb_mimetype')
      .eq('id', charmId)
      .single();

    if (error || !data?.glb_data) {
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


