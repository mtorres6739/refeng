import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.orgId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the reward exists and belongs to the organization
    const reward = await prisma.reward.findFirst({
      where: {
        id: params.id,
        orgId: session.user.orgId,
      },
    });

    if (!reward) {
      return new NextResponse('Reward not found', { status: 404 });
    }

    // Delete the reward
    await prisma.reward.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
