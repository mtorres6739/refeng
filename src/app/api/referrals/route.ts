import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationType, PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

// Get all referrals for the current user or organization
export async function GET() {
  console.log('=== Referrals API Debug Start ===');
  
  try {
    // 1. Get and validate session
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.email) {
      console.error('No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true },
    });
    console.log('User found:', user);

    if (!user) {
      console.error('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get referrals based on role and organization
    console.log('Fetching referrals for user:', user.id, 'org:', user.orgId);
    const referrals = await prisma.referral.findMany({
      where: {
        OR: [
          { userId: user.id },
          { orgId: user.orgId }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        notes: {
          select: {
            id: true,
            content: true,
            isInternal: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found referrals:', referrals.length);
    console.log('=== Referrals API Debug End ===');
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Error in referrals API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Create a new referral
export async function POST(req: Request) {
  try {
    // 1. Get and validate session
    const session = await getServerSession(authOptions);
    console.log('POST /api/referrals - Session:', session);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true },
    });
    console.log('User found:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get request body
    const body = await req.json();
    const { name, email, phone } = body;
    console.log('Request body:', { name, email, phone });

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Get default status
    const defaultStatus = await prisma.referralStatus.findFirst({
      where: { isDefault: true },
      select: { id: true }
    });
    console.log('Default status:', defaultStatus);

    if (!defaultStatus) {
      return NextResponse.json(
        { error: 'No default referral status found' },
        { status: 500 }
      );
    }

    // 3. Create referral
    const referral = await prisma.referral.create({
      data: {
        name,
        email,
        phone,
        userId: user.id,
        orgId: user.orgId,
        statusId: defaultStatus.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
        status: true,
      },
    });

    console.log('Created referral:', referral.id);
    return NextResponse.json(referral);
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
