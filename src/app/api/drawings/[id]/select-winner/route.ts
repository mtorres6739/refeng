import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DrawingStatus, UserRole } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('Unauthorized: No user email found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to ensure we have current role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, orgId: true },
    });

    console.log('User:', user);

    if (!user) {
      console.error('User not found:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can select winners
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      console.error('Permission denied: User is not an admin');
      return NextResponse.json(
        { error: 'You do not have permission to select winners' },
        { status: 403 }
      );
    }

    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      include: {
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
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Drawing:', JSON.stringify(drawing, null, 2));

    if (!drawing) {
      console.error('Drawing not found:', params.id);
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    // Check if user has permission to select winner for this drawing
    if (user.role !== UserRole.SUPER_ADMIN && drawing.orgId !== user.orgId) {
      console.error('Permission denied: User does not own the drawing');
      return NextResponse.json(
        { error: 'You do not have permission to select winner for this drawing' },
        { status: 403 }
      );
    }

    // Verify drawing is active and has minimum entries
    if (drawing.status !== DrawingStatus.ACTIVE) {
      console.error('Drawing is not active:', drawing.status);
      return NextResponse.json(
        { error: 'Drawing is not active' },
        { status: 400 }
      );
    }

    const totalEntries = drawing.entries.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
    if (totalEntries < drawing.minEntries) {
      console.error('Drawing does not have minimum required entries:', totalEntries, drawing.minEntries);
      return NextResponse.json(
        { error: 'Drawing does not have minimum required entries' },
        { status: 400 }
      );
    }

    // Get winner ID from request body
    const body = await req.json();
    const { winnerId } = body;

    console.log('Request body:', body);
    console.log('Winner ID:', winnerId);

    if (!winnerId) {
      console.error('Winner ID is required');
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    // Verify winner is a valid entry
    const winnerEntry = drawing.entries.find(entry => entry.id === winnerId);
    console.log('Winner entry:', winnerEntry);

    if (!winnerEntry) {
      console.error('Invalid winner ID:', winnerId);
      return NextResponse.json(
        { error: 'Invalid winner ID' },
        { status: 400 }
      );
    }

    // Create winner record and update drawing status in a transaction
    try {
      const [updatedDrawing] = await prisma.$transaction([
        prisma.drawing.update({
          where: { id: params.id },
          data: {
            status: DrawingStatus.COMPLETED,
            winnerId: winnerEntry.id,
            drawDate: new Date(),
          },
          include: {
            organization: true,
            entries: {
              where: {
                id: winnerEntry.id,
              },
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
        }),
        // Create notification for winner
        prisma.notification.create({
          data: {
            type: 'DRAWING_WON',
            title: 'Congratulations! You won a drawing!',
            message: `You won the "${drawing.name}" drawing! Prize: ${drawing.prize}`,
            userId: winnerEntry.userId,
            data: JSON.stringify({
              drawingId: params.id,
              drawingName: drawing.name,
              prize: drawing.prize,
            }),
          },
        }),
      ]);

      console.log('Updated drawing:', JSON.stringify(updatedDrawing, null, 2));

      // Transform dates to ISO strings and get winner from entries
      const response = {
        ...updatedDrawing,
        startDate: updatedDrawing.startDate.toISOString(),
        endDate: updatedDrawing.endDate.toISOString(),
        drawDate: updatedDrawing.drawDate?.toISOString() || null,
        createdAt: updatedDrawing.createdAt.toISOString(),
        updatedAt: updatedDrawing.updatedAt.toISOString(),
        entries: updatedDrawing.entries.map(entry => ({
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          user: entry.user,
        })),
        winner: updatedDrawing.entries[0]?.user,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error selecting winner:', error);
    return NextResponse.json(
      { error: 'Failed to select winner', details: error.message },
      { status: 500 }
    );
  }
}
