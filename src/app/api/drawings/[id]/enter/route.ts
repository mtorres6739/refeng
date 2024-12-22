import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST /api/drawings/[id]/enter:', session);

    if (!session?.user) {
      console.log('No session or user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const drawingId = params.id;
    console.log('Drawing ID:', drawingId);

    // Check if drawing exists and is not completed
    const drawing = await prisma.drawing.findUnique({
      where: { id: drawingId },
      include: { entries: true },
    });

    if (!drawing) {
      return new NextResponse('Drawing not found', { status: 404 });
    }

    if (drawing.isCompleted) {
      return new NextResponse('Drawing is already completed', { status: 400 });
    }

    // Check if user has already entered
    const existingEntry = await prisma.drawingEntry.findFirst({
      where: {
        drawingId,
        userId: session.user.id,
      },
    });

    if (existingEntry) {
      return new NextResponse('Already entered this drawing', { status: 400 });
    }

    // Create entry
    const entry = await prisma.drawingEntry.create({
      data: {
        drawing: {
          connect: {
            id: drawingId,
          },
        },
        user: {
          connect: {
            id: session.user.id,
          },
        },
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
    });

    console.log('Created entry:', entry);
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error in POST /api/drawings/[id]/enter:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
