import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { nanoid } from 'nanoid';

export async function POST(
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

    const program = await prisma.referralProgram.findUnique({
      where: {
        id: params.id,
      },
      include: {
        organization: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }

    if (program.organization.id !== session.user.orgId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate a unique referral code
    const referralCode = nanoid(10);
    
    // Create the referral link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/r/${referralCode}?p=${program.id}&u=${session.user.id}`;

    return NextResponse.json({
      referralCode,
      referralLink,
    });
  } catch (error) {
    console.error('Error generating referral link:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
