import { headers } from 'next/headers';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const { referralCode, programId, referrerId } = await req.json();

    // Validate input
    if (!referralCode || !programId || !referrerId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get IP and User Agent
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Create click record
    const click = await prisma.referralClick.create({
      data: {
        referralCode,
        program: {
          connect: {
            id: programId,
          },
        },
        referrer: {
          connect: {
            id: referrerId,
          },
        },
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(click, { status: 201 });
  } catch (error) {
    console.error('Error tracking referral click:', error);
    return NextResponse.json(
      { message: "Error tracking referral click" },
      { status: 500 }
    );
  }
}
