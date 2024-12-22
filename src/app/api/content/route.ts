import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentType, UserRole } from '@prisma/client';

export async function GET(req: Request) {
  try {
    console.log('[Content API] GET request received');
    const session = await getServerSession(authOptions);
    console.log('[Content API] Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('[Content API] No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as ContentType | null;
    const tag = searchParams.get('tag');
    const active = searchParams.get('active') !== 'false';

    console.log('[Content API] Query params:', { type, tag, active });

    // If user is SUPER_ADMIN, get content from all organizations
    const where = session.user.role === UserRole.SUPER_ADMIN
      ? {}
      : { orgId: session.user.organizations[0].id };

    // Add type and tag filters if present
    if (type) {
      where.type = type;
    }
    if (tag) {
      where.tags = { has: tag };
    }

    console.log('[Content API] Prisma where clause:', JSON.stringify(where, null, 2));

    const contentItems = await prisma.content.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[Content API] Found content items:', contentItems.length);
    return NextResponse.json(contentItems);
  } catch (error) {
    console.error('[Content API] Error in /api/content GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[Content API] POST Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('[Content API] No session or user found in POST');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create content
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can create content' },
        { status: 403 }
      );
    }

    const data = await req.json();
    console.log('[Content API] POST data:', JSON.stringify(data, null, 2));
    const { title, description, type, url, thumbnail, points } = data;

    // Validate required fields
    if (!title || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!Object.values(ContentType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Get organization ID from session
    const orgId = session.user.organization?.id;
    if (!orgId) {
      console.error('[Content API] No organization found in session:', session.user);
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 400 }
      );
    }

    // Create content
    const content = await prisma.content.create({
      data: {
        title,
        description: description || '',
        type,
        url,
        thumbnail: thumbnail || null,
        points: points || 0,
        active: true,
        userId: session.user.id,
        orgId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shares: true,
      },
    });

    console.log('[Content API] Created content:', JSON.stringify(content, null, 2));
    return NextResponse.json(content);
  } catch (error) {
    console.error('[Content API] Error in /api/content POST:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
