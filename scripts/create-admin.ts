const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // First check if Test Organization exists
    let organization = await prisma.organization.findUnique({
      where: {
        name: 'Test Organization',
      },
    });

    if (!organization) {
      console.log('Test Organization not found, checking Default Organization...');
      organization = await prisma.organization.findUnique({
        where: {
          name: 'Default Organization',
        },
      });

      if (!organization) {
        // Create Test Organization if neither exists
        organization = await prisma.organization.create({
          data: {
            name: 'Test Organization',
          },
        });
        console.log('Test Organization created:', organization);
      } else {
        console.log('Using Default Organization:', organization);
      }
    } else {
      console.log('Using existing Test Organization:', organization);
    }

    // Check if super admin exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'torres.mathew@gmail.com',
      },
    });

    if (existingUser) {
      // Update organization if needed
      if (existingUser.orgId !== organization.id) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { orgId: organization.id },
        });
        console.log('Updated super admin organization:', {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          orgId: updatedUser.orgId,
        });
      } else {
        console.log('Super admin already exists with correct organization:', {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          orgId: existingUser.orgId,
        });
      }
      return;
    }

    // Create super admin user
    const hashedPassword = await hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Mathew Torres',
        email: 'torres.mathew@gmail.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        orgId: organization.id,
        emailVerified: new Date(),
      },
    });

    console.log('Super admin user created:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
