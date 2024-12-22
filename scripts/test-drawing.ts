import { prisma } from '../src/lib/prisma';
import { DrawingEntryType, DrawingStatus } from '@prisma/client';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface DrawingEntry {
  quantity: number;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}

async function testDrawing() {
  try {
    // 1. Find an active drawing
    const drawing = await prisma.drawing.findFirst({
      where: {
        status: DrawingStatus.ACTIVE,
      },
    });

    if (!drawing) {
      console.log('No active drawing found');
      return;
    }

    console.log('Found active drawing:', drawing);

    // 2. Get some users to add to the drawing
    const users: User[] = await prisma.user.findMany({
      take: 5,
      where: {
        orgId: drawing.orgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`Found ${users.length} users to add to drawing`);

    // 3. Add entries for each user
    for (const user of users) {
      const entry = await prisma.drawingEntry.create({
        data: {
          drawingId: drawing.id,
          userId: user.id,
          quantity: Math.floor(Math.random() * 5) + 1, // Random 1-5 entries
          entryType: DrawingEntryType.MANUAL,
        },
      });

      console.log(`Added ${entry.quantity} entries for user ${user.name || user.email}`);
    }

    // 4. Get total entries
    const entries: DrawingEntry[] = await prisma.drawingEntry.findMany({
      where: {
        drawingId: drawing.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const totalEntries = entries.reduce((sum: number, entry: DrawingEntry) => sum + entry.quantity, 0);
    console.log('\nCurrent Entries:');
    entries.forEach((entry: DrawingEntry) => {
      console.log(`- ${entry.user.name || entry.user.email}: ${entry.quantity} entries`);
    });
    console.log(`Total entries: ${totalEntries}`);

    // 5. Select a winner
    const updatedDrawing = await prisma.drawing.update({
      where: { id: drawing.id },
      data: {
        status: DrawingStatus.COMPLETED,
        winnerUserId: entries[Math.floor(Math.random() * entries.length)].userId,
      },
      include: {
        winner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('\nWinner selected!');
    console.log('Winner:', updatedDrawing.winner?.name || updatedDrawing.winner?.email || 'Unknown');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDrawing();
