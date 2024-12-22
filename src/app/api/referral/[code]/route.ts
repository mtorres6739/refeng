import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');
    const referrerId = searchParams.get('referrerId');

    if (!programId || !referrerId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get program details
    const program = await prisma.referralProgram.findUnique({
      where: {
        id: programId,
      },
      include: {
        incentives: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }

    // Get referrer details
    const referrer = await prisma.user.findUnique({
      where: {
        id: referrerId,
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { message: "Referrer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      programName: program.name,
      referrerName: referrer.name || 'Someone',
      incentives: program.incentives.map(incentive => ({
        name: incentive.name,
        description: incentive.description,
        type: incentive.type,
        value: incentive.value,
      })),
    });
  } catch (error) {
    console.error('Error fetching referral details:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
