import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN can view all organizations and their users
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orgId: true,
          },
        },
        _count: {
          select: {
            users: true,
            referrals: true,
            content: true,
            drawings: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('Organizations fetched:', organizations);

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can create organizations
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { name, address, city, state, zip } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this name already exists' },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        streetAddress: address,
        city,
        state,
        zip,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
