import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationType, PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

// Get all notifications for the current user
export async function GET() {
  console.log('=== Notifications API Debug Start ===');
  
  try {
    // Verify prisma instance
    if (!prisma || !(prisma instanceof PrismaClient)) {
      console.error('Invalid prisma instance:', prisma);
      throw new Error('Prisma client not properly initialized');
    }

    // 1. Get and validate session
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.error('No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notifications for user
    console.log('Fetching notifications for user:', session.user.id);
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        data: true,
      },
      take: 50,
    });

    // Map and return results
    const mappedNotifications = notifications.map(n => n);

    console.log('=== Notifications API Debug End ===');
    return NextResponse.json(mappedNotifications);
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(req: Request) {
  try {
    // 1. Get and validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get request body
    const { notificationIds } = await req.json();
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 3. Update notifications
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
