import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const statuses = await prisma.referralStatus.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching referral statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statuses', details: error.message },
      { status: 500 }
    );
  }
}
