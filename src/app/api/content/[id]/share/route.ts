import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SharePlatform } from "@prisma/client";

export async function POST(
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        shares: {
          where: { userId: user.id },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Create share record
    const share = await prisma.contentShare.create({
      data: {
        contentId: params.id,
        userId: user.id,
        platform: SharePlatform.OTHER,
        shareUrl: content.url,
        trackingId: `${params.id}-${user.id}-${Date.now()}`,
      },
      include: {
        content: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(share);
  } catch (error) {
    console.error("Error sharing content:", error);
    return NextResponse.json(
      { error: "Failed to share content" },
      { status: 500 }
    );
  }
}
