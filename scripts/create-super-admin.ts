const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prismaClient = new PrismaClient();

async function main() {
  try {
    // First create an organization
    const org = await prismaClient.organization.create({
      data: {
        name: 'Admin Organization',
      },
    });

    console.log('Created organization:', org);

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create the super admin user
    const user = await prismaClient.user.create({
      data: {
        id: 'user_' + Date.now(),
        name: 'Mathew Torres',
        email: 'torres.mathew@gmail.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        organizations: {
          connect: {
            id: org.id
          }
        }
      },
    });

    console.log('Created super admin user:', user);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prismaClient.$disconnect();
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
