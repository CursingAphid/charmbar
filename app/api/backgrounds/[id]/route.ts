import { NextResponse } from 'next/server';
import { getBackgroundById } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params as any);
    const id = resolvedParams?.id;
    const background = await getBackgroundById(id);

    if (!background) {
      return NextResponse.json({ error: 'Background not found' }, { status: 404 });
    }

    return NextResponse.json(background);
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ error: 'Failed to fetch background' }, { status: 500 });
  }
}
