const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Your user ID
  const userId = 'cm4xkjnp30003we9pfw7jyzdi';
  
  // The referral ID
  const referralId = 'cm4waziak000c3jeti0i9c2s7';

  console.log('\n=== User Details ===');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      org: true,
    },
  });
  console.log('User:', {
    id: user?.id,
    email: user?.email,
    orgId: user?.orgId,
    orgName: user?.org?.name,
  });

  console.log('\n=== Referral Details ===');
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      organization: true,
      referredBy: {
        select: {
          id: true,
          email: true,
          orgId: true,
        },
      },
    },
  });
  console.log('Referral:', {
    id: referral?.id,
    orgId: referral?.orgId,
    orgName: referral?.organization?.name,
    referredById: referral?.referredById,
    referredByEmail: referral?.referredBy?.email,
    referredByOrgId: referral?.referredBy?.orgId,
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
