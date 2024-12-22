import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can update organizations
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);
    console.log('Organization ID:', params.id);

    const { name, address, city, state, zip } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // First check if the organization exists
    const orgExists = await prisma.organization.findUnique({
      where: { id: params.id },
    });

    if (!orgExists) {
      return NextResponse.json(
        { error: `Organization with ID ${params.id} not found` },
        { status: 404 }
      );
    }

    // Check if another org exists with the same name
    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: params.id,
        },
      },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this name already exists' },
        { status: 400 }
      );
    }

    try {
      const organization = await prisma.organization.update({
        where: { id: params.id },
        data: {
          name,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
        },
      });
      console.log('Updated organization:', organization);
      return NextResponse.json(organization);
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to update organization in database',
          details: dbError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in PATCH /api/organizations/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update organization',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        users: true,
        referrals: {
          include: {
            status: true
          }
        },
        _count: {
          select: {
            users: true,
            referrals: true,
            rewards: true,
            programs: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can delete organizations
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    // Check if organization has any users or referrals
    const org = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            referrals: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (org._count.users > 0 || org._count.referrals > 0) {
      return NextResponse.json(
        { error: 'Cannot delete organization with existing users or referrals' },
        { status: 400 }
      );
    }

    await prisma.organization.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
