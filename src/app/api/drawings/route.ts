import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DrawingStatus, UserRole } from '@prisma/client';

export async function GET() {
  try {
    console.log('=== GET /api/drawings - Debug Start ===');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session data:', {
      user: session.user,
      expires: session.expires
    });

    // Ensure we have the required user data
    if (!session.user.email || !session.user.orgId) {
      console.error('Missing required user data:', {
        email: session.user.email,
        orgId: session.user.orgId,
        organizations: session.user.organizations
      });
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    try {
      console.log('Fetching drawings for organization:', session.user.orgId);

      const drawings = await prisma.drawing.findMany({
        where: {
          orgId: session.user.orgId,
        },
        include: {
          entries: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          DrawingEntry_Drawing_winnerIdToDrawingEntry: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('Successfully fetched drawings:', {
        count: drawings.length,
        drawingIds: drawings.map(d => d.id),
      });

      return NextResponse.json(drawings);
    } catch (prismaError: any) {
      console.error('Prisma error:', prismaError);
      return NextResponse.json(
        { error: 'Database error', details: prismaError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log('=== POST /api/drawings - Debug Start ===');
    
    const session = await getServerSession(authOptions);
    console.log('Full session data:', {
      session,
      user: session?.user,
      userId: session?.user?.id,
      orgId: session?.user?.orgId
    });
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.id) {
      console.log('No user ID in session');
      return NextResponse.json({ 
        error: 'Missing user ID', 
        sessionData: session 
      }, { status: 400 });
    }

    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, orgId: true }
    });

    if (!user) {
      console.log('User not found in database:', session.user.id);
      return NextResponse.json({ 
        error: 'User not found',
        userId: session.user.id
      }, { status: 400 });
    }

    if (!user.orgId) {
      console.log('No orgId for user:', user);
      return NextResponse.json({ 
        error: 'User has no organization',
        user
      }, { status: 400 });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { id: true }
    });

    if (!organization) {
      console.log('Organization not found:', user.orgId);
      return NextResponse.json({ 
        error: 'Invalid organization ID',
        orgId: user.orgId
      }, { status: 400 });
    }

    const data = await req.json();
    console.log('Request data:', JSON.stringify(data, null, 2));

    // Validate required fields
    const requiredFields = ['name', 'prize', 'startDate', 'endDate', 'drawDate', 'minEntries'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: 'Missing required fields', 
        fields: missingFields 
      }, { status: 400 });
    }

    // Parse and validate dates
    try {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const drawDate = new Date(data.drawDate);

      if (isNaN(startDate.getTime())) throw new Error('Invalid start date');
      if (isNaN(endDate.getTime())) throw new Error('Invalid end date');
      if (isNaN(drawDate.getTime())) throw new Error('Invalid draw date');

      if (endDate < startDate) throw new Error('End date must be after start date');
      if (drawDate < endDate) throw new Error('Draw date must be after end date');

      console.log('Creating drawing with data:', {
        name: data.name,
        orgId: user.orgId,
        userId: user.id
      });

      const drawing = await prisma.drawing.create({
        data: {
          name: data.name,
          description: data.description || null,
          prize: data.prize,
          prizeDetails: data.prizeDetails || null,
          rules: data.rules || null,
          startDate,
          endDate,
          drawDate,
          minEntries: parseInt(data.minEntries.toString()),
          maxEntries: data.maxEntries ? parseInt(data.maxEntries.toString()) : null,
          status: DrawingStatus.ACTIVE,
          orgId: user.orgId,
          createdById: user.id,
        },
      });

      console.log('Created drawing:', JSON.stringify(drawing, null, 2));
      return NextResponse.json(drawing);
    } catch (error: any) {
      console.error('Validation/Database error:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to create drawing' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating drawing:', {
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to create drawing', details: error.message },
      { status: 500 }
    );
  }
}
