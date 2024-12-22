import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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

    // Only allow admins and super admins to reorder statuses
    if (user.role === UserRole.CLIENT) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { statusOrders } = await req.json();

    // Update each status order in a transaction
    await prisma.$transaction(
      statusOrders.map(({ id, order }: { id: string; order: number }) =>
        prisma.referralStatus.update({
          where: { id },
          data: { order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering statuses:', error);
    return NextResponse.json(
      { message: "Error reordering statuses" },
      { status: 500 }
    );
  }
}
