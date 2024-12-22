const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prismaClient = new PrismaClient();

async function main() {
  try {
    // First create an organization
    const org = await prismaClient.organization.create({
      data: {
        name: 'Test Organization',
      },
    });

    console.log('Created organization:', org);

    // Then create a user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prismaClient.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        orgId: org.id,
      },
    });

    console.log('Created test user:', user);
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
