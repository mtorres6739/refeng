import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in GET /api/user:', {
      session,
      user: session?.user,
      email: session?.user?.email,
      id: session?.user?.id
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    try {
      // Get user by ID since that's what we have in the session
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log('User fetched:', {
        id: user?.id,
        email: user?.email,
        orgId: user?.orgId,
        organizationId: user?.organization?.id
      });

      if (!user) {
        console.log('User not found in database');
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      });
    } catch (dbError) {
      console.error('Database error:', {
        error: dbError,
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      throw dbError;
    }
  } catch (error) {
    console.error('Error in GET /api/user:', {
      error,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    return NextResponse.json(
      { error: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in PUT /api/user:', {
      session,
      user: session?.user,
      email: session?.user?.email,
      id: session?.user?.id
    });

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    try {
      const body = await req.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
      const { name, email, currentPassword, newPassword } = body;

      // Get current user
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
      });

      if (!user) {
        console.log('User not found in database');
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Prepare update data
      const updateData: any = {};

      if (name) {
        updateData.name = name;
      }

      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 400 }
          );
        }

        updateData.email = email;
      }

      if (currentPassword && newPassword) {
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }

        // Hash new password
        updateData.password = await bcrypt.hash(newPassword, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Transform the response
      const response = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organization: updatedUser.organization
      };

      return NextResponse.json(response);
    } catch (dbError) {
      console.error('Database error:', {
        error: dbError,
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      throw dbError;
    }
  } catch (error) {
    console.error('Error in PUT /api/user:', {
      error,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
