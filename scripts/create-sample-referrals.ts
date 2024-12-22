const { PrismaClient, UserRole } = require('@prisma/client');
const { subMonths, startOfMonth } = require('date-fns');

const prisma = new PrismaClient();

async function main() {
  // Get or create a test organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Test Organization' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        address: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
      },
    });
  }

  // Get or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'test@example.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
        orgId: org.id,
      },
    });
  }

  // Get or create referral statuses
  const statusData = [
    { name: 'New', color: '#6366F1', description: 'Newly submitted referral', order: 1, isDefault: true },
    { name: 'Contacted', color: '#10B981', description: 'Initial contact made', order: 2, isDefault: false },
    { name: 'Qualified', color: '#F59E0B', description: 'Referral has been qualified', order: 3, isDefault: false },
    { name: 'Converted', color: '#3B82F6', description: 'Successfully converted', order: 4, isDefault: false },
    { name: 'Lost', color: '#EF4444', description: 'Opportunity lost', order: 5, isDefault: false }
  ];

  const statuses = await Promise.all(
    statusData.map(async (data) => {
      let status = await prisma.referralStatus.findFirst({
        where: { name: data.name, orgId: org.id },
      });

      if (!status) {
        status = await prisma.referralStatus.create({
          data: {
            ...data,
            orgId: org.id,
          },
        });
      } else {
        // Update existing status with new fields
        status = await prisma.referralStatus.update({
          where: { id: status.id },
          data: {
            ...data,
            orgId: org.id,
          },
        });
      }

      return status;
    })
  );

  // Create sample referrals over the past 6 months
  const referralData = [];
  for (let i = 0; i < 50; i++) {
    const monthsAgo = Math.floor(Math.random() * 6);
    const date = startOfMonth(subMonths(new Date(), monthsAgo));
    
    referralData.push({
      name: `Referral ${i + 1}`,
      email: `referral${i + 1}@example.com`,
      phone: `+1555${String(Math.floor(1000000 + Math.random() * 9000000)).padStart(7, '0')}`,
      orgId: org.id,
      statusId: statuses[Math.floor(Math.random() * statuses.length)].id,
      userId: user.id,
      createdAt: date,
    });
  }

  // Insert referrals in batches
  await prisma.referral.createMany({
    data: referralData,
    skipDuplicates: true,
  });

  console.log('Sample referrals created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
