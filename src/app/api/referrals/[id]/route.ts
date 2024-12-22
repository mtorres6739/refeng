import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/referrals/[id] called with id:', params.id);
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No valid session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true },
    });
    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate referral ID format
    if (!params.id || typeof params.id !== 'string' || params.id.length !== 36) {
      console.log('Invalid referral ID format:', params.id);
      return NextResponse.json(
        { error: "Invalid referral ID format" },
        { status: 400 }
      );
    }

    // Get the referral with all related data
    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
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

    console.log('Referral found:', referral ? 'yes' : 'no');

    if (!referral) {
      console.log('Referral not found:', params.id);
      return NextResponse.json(
        { error: "Referral not found", id: params.id },
        { status: 404 }
      );
    }

    // Check authorization
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAdmin = user.role === UserRole.ADMIN;
    const isOrgMember = referral.orgId === user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgMember) {
      console.log('User not authorized to view referral');
      return NextResponse.json(
        { error: "You do not have permission to view this referral" },
        { status: 403 }
      );
    }

    // Get notes separately
    const notes = await prisma.referralNote.findMany({
      where: { referralId: params.id },
      include: {
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
    });

    console.log('Successfully returning referral');
    return NextResponse.json({ ...referral, notes });
  } catch (error) {
    console.error('Error in GET /api/referrals/[id]:', error);
    return NextResponse.json(
      { error: "Failed to fetch referral", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== PATCH /api/referrals/[id] Debug Start ===');
    console.log('Referral ID:', params.id);
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.email) {
      console.log('No valid session found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, orgId: true, role: true },
    });
    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);
    const { statusId, note, name, email, phone } = body;

    // Find the referral and verify organization access
    console.log('Finding referral:', params.id);
    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          include: {
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
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    console.log('Referral found:', referral ? 'yes' : 'no');

    if (!referral) {
      console.log('Referral not found:', params.id);
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 }
      );
    }

    // Allow super admins to update any referral
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    if (!isSuperAdmin && referral.orgId !== user.orgId) {
      console.log('User not authorized:', user.role, user.orgId, 'vs', referral.orgId);
      return NextResponse.json(
        { error: "You do not have permission to update this referral" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (statusId) updateData.statusId = statusId;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    console.log('Update data:', updateData);

    try {
      // Update the referral
      const updatedReferral = await prisma.referral.update({
        where: { id: params.id },
        data: updateData,
        include: {
          notes: {
            include: {
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
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      console.log('Referral updated successfully:', updatedReferral);

      // If a note was provided, create it
      if (note) {
        console.log('Creating note:', {
          content: note,
          userId: user.id,
          referralId: params.id,
          isInternal: true,
        });
        
        const createdNote = await prisma.referralNote.create({
          data: {
            content: note,
            userId: user.id,
            referralId: params.id,
            isInternal: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        console.log('Note created successfully:', createdNote);

        // Add the new note to the updatedReferral.notes array
        updatedReferral.notes.unshift(createdNote);
      }

      console.log('=== PATCH /api/referrals/[id] Debug End ===');
      return NextResponse.json(updatedReferral);
    } catch (error) {
      console.error('Error updating referral:', error);
      return NextResponse.json(
        { error: "Error updating referral", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PATCH /api/referrals/[id]:', error);
    return NextResponse.json(
      { error: "Error updating referral", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
