import { NextResponse } from 'next/server';
import { getCharmById, getBackgroundById, bufferFromByteaField } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the charm to find its background_id
    const charm = await getCharmById(params.id);

    if (!charm) {
      return NextResponse.json({ error: 'Charm not found' }, { status: 404 });
    }

    if (!charm.background_id) {
      return NextResponse.json({ error: 'Charm has no background' }, { status: 404 });
    }

    // Get the background data
    const background = await getBackgroundById(charm.background_id.toString());

    if (!background || !background.image_data) {
      return NextResponse.json({ error: 'Background image not found' }, { status: 404 });
    }

    // Convert bytea data to buffer
    const buffer = bufferFromByteaField(background.image_data);

    // Return the image with proper headers
    const headers = new Headers();
    headers.set('Content-Type', background.image_mimetype || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error fetching charm background image:', error);
    return NextResponse.json({ error: 'Failed to fetch background image' }, { status: 500 });
  }
}
