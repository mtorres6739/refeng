const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const referrals = await prisma.referral.findMany({
      include: {
        user: true,
        organization: true,
        status: true,
        notes: true
      }
    });

    console.log('All referrals:', referrals);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
