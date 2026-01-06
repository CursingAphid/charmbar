import { NextResponse } from 'next/server';
import { getBackgrounds } from '@/lib/db';

export async function GET() {
  try {
    const backgrounds = await getBackgrounds();
    return NextResponse.json(backgrounds);
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    return NextResponse.json({ error: 'Failed to fetch backgrounds' }, { status: 500 });
  }
}

