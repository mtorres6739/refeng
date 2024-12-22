import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in POST /api/programs:', session);

    if (!session?.user) {
      console.log('No session or user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);
    const { name, description, startDate, endDate, incentives } = body;

    // Validate input
    if (!name || !startDate || !incentives?.length) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create program with incentives
    const program = await prisma.referralProgram.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        organization: {
          connect: {
            id: session.user.orgId,
          },
        },
        incentives: {
          create: incentives.map((incentive: any) => ({
            name: incentive.name,
            description: incentive.description,
            type: incentive.type,
            value: incentive.value,
          })),
        },
      },
      include: {
        incentives: true,
      },
    });

    console.log('Created program:', program);
    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/programs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in GET /api/programs:', session);

    if (!session?.user) {
      console.log('No session or user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('User orgId:', session.user.orgId);

    const programs = await prisma.referralProgram.findMany({
      where: {
        orgId: session.user.orgId,
      },
      include: {
        incentives: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Programs fetched:', programs);
    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error in GET /api/programs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
