import { NextResponse } from 'next/server';
import { getCharmById, getBackgroundById } from '@/lib/db';
import { bufferFromByteaField } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params as any);
  const charmId = resolvedParams?.id;
  console.log(`[API] Fetching background for charm ID: ${charmId}`);

  try {
    // Get the charm to find its background_id
    const charm = await getCharmById(charmId);

    if (!charm) {
      console.log(`[API] Charm not found: ${charmId}`);
      return NextResponse.json({ error: `Charm not found: ${charmId}` }, { status: 404 });
    }

    console.log(`[API] Charm data:`, { id: charm.id, background_id: charm.background_id });

    if (!charm.background_id) {
      console.log(`[API] Charm ${charmId} has no background_id`);
      return NextResponse.json({ error: 'Charm has no background' }, { status: 404 });
    }

    // Get the background data
    const background = await getBackgroundById(charm.background_id.toString());

    if (!background) {
      console.log(`[API] Background not found for ID: ${charm.background_id}`);
      return NextResponse.json({ error: `Background not found: ${charm.background_id}` }, { status: 404 });
    }

    if (!background.image_data) {
      console.log(`[API] Background ${charm.background_id} has no image_data`);
      return NextResponse.json({ error: 'Background image data missing' }, { status: 404 });
    }

    console.log(`[API] Found background image data for charm ${charmId}`);

    // Convert bytea data to buffer
    const buffer = bufferFromByteaField(background.image_data);

    // Convert to Uint8Array for web compatibility
    const uint8Array = new Uint8Array(buffer);

    // Return the image with proper headers
    const headers = new Headers();
    headers.set('Content-Type', background.image_mimetype || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new NextResponse(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching charm background image:', error);
    return NextResponse.json({ error: 'Failed to fetch background image' }, { status: 500 });
  }
}
