import { createApi } from 'unsplash-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const result = await unsplash.search.getPhotos({
      query,
      page: parseInt(page),
      perPage: parseInt(perPage),
    });

    if (result.errors) {
      console.error('Unsplash API error:', result.errors);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json(result.response);
  } catch (error) {
    console.error('Error in Unsplash API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
