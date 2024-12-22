import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Get all statuses for the organization
export async function GET() {
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

    const statuses = await prisma.referralStatus.findMany({
      where: { orgId: user.orgId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { message: "Error fetching statuses" },
      { status: 500 }
    );
  }
}

// Create a new status
export async function POST(req: Request) {
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

    // Only allow admins and super admins to create statuses
    if (user.role === UserRole.CLIENT) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { name, color, description, isDefault } = await req.json();

    // Get the highest order number
    const highestOrder = await prisma.referralStatus.findFirst({
      where: { orgId: user.orgId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // If this is the first status or isDefault is true, make it the default
    const existingDefault = await prisma.referralStatus.findFirst({
      where: { orgId: user.orgId, isDefault: true },
    });

    const newStatus = await prisma.referralStatus.create({
      data: {
        name,
        color,
        description,
        order: (highestOrder?.order ?? -1) + 1,
        isDefault: isDefault || !existingDefault,
        organization: { connect: { id: user.orgId } },
      },
    });

    // If this is set as default, remove default from other statuses
    if (newStatus.isDefault && existingDefault) {
      await prisma.referralStatus.update({
        where: { id: existingDefault.id },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(newStatus);
  } catch (error) {
    console.error('Error creating status:', error);
    return NextResponse.json(
      { message: "Error creating status" },
      { status: 500 }
    );
  }
}
