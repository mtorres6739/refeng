import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { name, email, password, organizationName } = await req.json();
    
    console.log('Registration attempt:', { name, email, organizationName });

    // Validate input
    if (!name || !email || !password || !organizationName) {
      console.log('Missing fields:', { name, email, password: !!password, organizationName });
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use Prisma transaction to ensure both organization and user are created or neither is
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
        },
      });

      console.log('Created organization:', organization.id);

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
          orgId: organization.id, // Use direct orgId reference
        },
      });

      console.log('Created user:', user.id);

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to register' },
      { status: 500 }
    );
  }
}
