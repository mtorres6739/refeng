import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { createMessageNotification } from '@/lib/notifications';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Get the user and referral with organization details
    const [user, referral] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          organization: {
            include: {
              users: {
                where: {
                  role: {
                    in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                  },
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
      prisma.referral.findUnique({
        where: { id: params.id },
        include: {
          user: true,
          organization: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Create the note
    const note = await prisma.note.create({
      data: {
        content: data.content,
        isInternal: data.isInternal || false,
        referral: {
          connect: { id: params.id },
        },
        author: {
          connect: { id: user.id },
        },
      },
      include: {
        author: true,
      },
    });

    // Create notifications for admins and the referral owner
    const notifyUsers = new Set([
      ...user.organization.users.map((admin) => admin.id),
      referral.user.id,
    ]);

    // Don't notify the user who created the note
    notifyUsers.delete(user.id);

    const notificationPromises = Array.from(notifyUsers).map((userId) =>
      createMessageNotification({
        userId,
        referralId: referral.id,
        referralName: referral.name,
        messageId: note.id,
        messagePreview: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// Edit note
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { noteId, content, isInternal } = await req.json();

    // Find the note and verify ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        referral: {
          select: { orgId: true },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { message: "Note not found" },
        { status: 404 }
      );
    }

    // Only allow note author, org members, or super admins to edit
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAuthor = note.userId === user.id;
    const isOrgMember = note.referral.orgId === user.orgId;

    if (!isSuperAdmin && !isAuthor && !isOrgMember) {
      return NextResponse.json(
        { message: "You do not have permission to edit this note" },
        { status: 401 }
      );
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        content,
        isInternal,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { message: "Error updating note" },
      { status: 500 }
    );
  }
}

// Delete note
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { message: "Note ID is required" },
        { status: 400 }
      );
    }

    // Find the note and verify ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        referral: {
          select: { orgId: true },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { message: "Note not found" },
        { status: 404 }
      );
    }

    // Only allow note author, org members, or super admins to delete
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAuthor = note.userId === user.id;
    const isOrgMember = note.referral.orgId === user.orgId;

    if (!isSuperAdmin && !isAuthor && !isOrgMember) {
      return NextResponse.json(
        { message: "You do not have permission to delete this note" },
        { status: 401 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { message: "Error deleting note" },
      { status: 500 }
    );
  }
}
