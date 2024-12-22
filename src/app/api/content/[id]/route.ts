import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Delete content
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the content item
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAdmin = user.role === UserRole.ADMIN;
    const isOrgContent = content.orgId === user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgContent) {
      return NextResponse.json(
        { error: "You do not have permission to delete this content" },
        { status: 403 }
      );
    }

    // Delete the content
    await prisma.content.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

// Update content
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the content item
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check permissions
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const isAdmin = user.role === UserRole.ADMIN;
    const isOrgContent = content.orgId === user.orgId;

    if (!isSuperAdmin && !isAdmin && !isOrgContent) {
      return NextResponse.json(
        { error: "You do not have permission to update this content" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, type, url, thumbnail, points, active } = body;

    // Update the content
    const updatedContent = await prisma.content.update({
      where: { id: params.id },
      data: {
        title,
        description,
        type,
        url,
        thumbnail,
        points,
        active,
      },
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
            id: true,
            name: true,
          },
        },
        shares: true,
      },
    });

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
