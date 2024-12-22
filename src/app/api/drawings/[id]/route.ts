import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DrawingStatus, UserRole } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get and validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the drawing with all necessary relations
    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        entries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        DrawingEntry_Drawing_winnerIdToDrawingEntry: {
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
    });

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    // 3. Check user permissions
    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOrgMember = drawing.organization.id === session.user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: 'You do not have permission to view this drawing' },
        { status: 403 }
      );
    }

    // Transform dates to ISO strings
    const response = {
      ...drawing,
      startDate: drawing.startDate.toISOString(),
      endDate: drawing.endDate.toISOString(),
      drawDate: drawing.drawDate?.toISOString() || null,
      createdAt: drawing.createdAt.toISOString(),
      updatedAt: drawing.updatedAt.toISOString(),
      entries: drawing.entries.map(entry => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
      DrawingEntry_Drawing_winnerIdToDrawingEntry: drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry
        ? {
            ...drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry,
            createdAt: drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.createdAt.toISOString(),
            updatedAt: drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.updatedAt.toISOString(),
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching drawing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drawing', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { action } = data;

    // Get the drawing
    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        entries: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOrgMember = drawing.organization.id === session.user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this drawing' },
        { status: 403 }
      );
    }

    // Handle different actions
    if (action === 'select-winner') {
      // Validate drawing state
      if (drawing.status !== DrawingStatus.ACTIVE) {
        return NextResponse.json(
          { error: 'Drawing must be active to select a winner' },
          { status: 400 }
        );
      }

      if (drawing.entries.length < drawing.minEntries) {
        return NextResponse.json(
          { error: 'Not enough entries to select a winner' },
          { status: 400 }
        );
      }

      // Randomly select a winner
      const randomIndex = Math.floor(Math.random() * drawing.entries.length);
      const winningEntry = drawing.entries[randomIndex];

      // Update the drawing
      const updatedDrawing = await prisma.drawing.update({
        where: { id: params.id },
        data: {
          status: DrawingStatus.COMPLETED,
          winner: {
            connect: {
              id: winningEntry.id,
            },
          },
        },
        include: {
          winner: {
            include: {
              user: true,
            },
          },
        },
      });

      return NextResponse.json(updatedDrawing);
    }

    // Handle other updates
    const { name, description, prize, prizeDetails, startDate, endDate, drawDate, rules, minEntries, maxEntries } = data;

    const updatedDrawing = await prisma.drawing.update({
      where: { id: params.id },
      data: {
        name,
        description,
        prize,
        prizeDetails,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        drawDate: drawDate ? new Date(drawDate) : undefined,
        rules,
        minEntries,
        maxEntries,
      },
    });

    return NextResponse.json(updatedDrawing);
  } catch (error: any) {
    console.error('Error updating drawing:', error);
    return NextResponse.json(
      { error: 'Failed to update drawing', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the drawing
    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOrgMember = drawing.organization.id === session.user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this drawing' },
        { status: 403 }
      );
    }

    // Delete the drawing
    await prisma.drawing.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Drawing deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting drawing:', error);
    return NextResponse.json(
      { error: 'Failed to delete drawing', details: error.message },
      { status: 500 }
    );
  }
}
