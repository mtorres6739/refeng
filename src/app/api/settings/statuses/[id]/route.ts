import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Update a status
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Only allow admins and super admins to update statuses
    if (user.role === UserRole.CLIENT) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const status = await prisma.referralStatus.findUnique({
      where: { id: params.id },
    });

    if (!status || status.orgId !== user.orgId) {
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 }
      );
    }

    if (status.isSystem) {
      return NextResponse.json(
        { message: "Cannot modify system status" },
        { status: 403 }
      );
    }

    const { name, color, description, isDefault } = await req.json();

    // If this is being set as default, remove default from other statuses
    if (isDefault && !status.isDefault) {
      await prisma.referralStatus.updateMany({
        where: { 
          orgId: user.orgId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedStatus = await prisma.referralStatus.update({
      where: { id: params.id },
      data: {
        name,
        color,
        description,
        isDefault,
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { message: "Error updating status" },
      { status: 500 }
    );
  }
}

// Delete a status
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { orgId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Only allow admins and super admins to delete statuses
    if (user.role === UserRole.CLIENT) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const status = await prisma.referralStatus.findUnique({
      where: { id: params.id },
      include: {
        referrals: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!status || status.orgId !== user.orgId) {
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 }
      );
    }

    if (status.isSystem) {
      return NextResponse.json(
        { message: "Cannot delete system status" },
        { status: 403 }
      );
    }

    if (status.isDefault) {
      return NextResponse.json(
        { message: "Cannot delete default status" },
        { status: 403 }
      );
    }

    if (status.referrals.length > 0) {
      // Find default status to move referrals to
      const defaultStatus = await prisma.referralStatus.findFirst({
        where: { 
          orgId: user.orgId,
          isDefault: true,
        },
      });

      if (!defaultStatus) {
        return NextResponse.json(
          { message: "No default status found to move referrals to" },
          { status: 400 }
        );
      }

      // Move all referrals to default status
      await prisma.referral.updateMany({
        where: { statusId: status.id },
        data: { statusId: defaultStatus.id },
      });
    }

    await prisma.referralStatus.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json(
      { message: "Error deleting status" },
      { status: 500 }
    );
  }
}
