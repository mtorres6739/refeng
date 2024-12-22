import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const rewards = await prisma.reward.findMany({
      where: {
        orgId: session.user.orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, description, pointsCost } = await request.json();

    if (!name || !description || pointsCost === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        pointsCost,
        orgId: session.user.orgId,
      },
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error creating reward:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
