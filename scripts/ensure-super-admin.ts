const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prismaClient = new PrismaClient();

async function main() {
  try {
    // Check if super admin already exists
    const existingUser = await prismaClient.user.findUnique({
      where: {
        email: 'torres.mathew@gmail.com',
      },
    });

    if (existingUser) {
      // If user exists, ensure they are a super admin
      const updatedUser = await prismaClient.user.update({
        where: {
          email: 'torres.mathew@gmail.com',
        },
        data: {
          role: UserRole.SUPER_ADMIN,
        },
      });
      console.log('Updated existing super admin:', updatedUser);
      return;
    }

    // Create default organization if it doesn't exist
    let org = await prismaClient.organization.findFirst({
      where: {
        name: 'Default Organization',
      },
    });

    if (!org) {
      org = await prismaClient.organization.create({
        data: {
          name: 'Default Organization',
        },
      });
      console.log('Created organization:', org);
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prismaClient.user.create({
      data: {
        name: 'Mathew Torres',
        email: 'torres.mathew@gmail.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        orgId: org.id,
      },
    });

    console.log('Created super admin:', user);

  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
