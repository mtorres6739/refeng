import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DrawingStatus, UserRole } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    console.log('Request data:', data);

    const { userId, quantity = 1 } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Get the drawing
    const drawing = await prisma.drawing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        maxEntries: true,
        entries: true,
        orgId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found' }, { status: 404 });
    }

    console.log('Drawing:', JSON.stringify(drawing, null, 2));

    // Check if drawing is active
    if (drawing.status !== DrawingStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Drawing is not active' },
        { status: 400 }
      );
    }

    // Check if drawing has reached max entries
    if (
      drawing.maxEntries &&
      drawing.entries.length >= drawing.maxEntries
    ) {
      return NextResponse.json(
        { error: 'Drawing has reached maximum entries' },
        { status: 400 }
      );
    }

    // Check if user is in the same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        orgId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    console.log('Target user:', JSON.stringify(targetUser, null, 2));
    console.log('Session:', JSON.stringify(session, null, 2));

    // Check if either the target user or the drawing's organization matches
    const isInOrg = targetUser.orgId === drawing.orgId;
    console.log('Organization check:', JSON.stringify({
      targetUserOrgId: targetUser.orgId,
      drawingOrgId: drawing.orgId,
      isInOrg,
      sessionOrgId: session.user.orgId,
    }, null, 2));

    if (!isInOrg) {
      return NextResponse.json(
        { error: 'Target user is not in the same organization' },
        { status: 403 }
      );
    }

    // Check if user has permission to add entries
    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOrgMember = session.user.orgId === drawing.organization.id;

    if (!isSuperAdmin && !isAdmin && !isOrgMember) {
      return NextResponse.json(
        { error: 'You do not have permission to add entries to this drawing' },
        { status: 403 }
      );
    }

    // Create entries
    const entries = await Promise.all(
      Array.from({ length: quantity }).map(() =>
        prisma.drawingEntry.create({
          data: {
            drawingId: params.id,
            userId,
            updatedAt: new Date(),
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
        })
      )
    );

    return NextResponse.json(entries[0]);
  } catch (error: any) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry', details: error.message },
      { status: 500 }
    );
  }
}
