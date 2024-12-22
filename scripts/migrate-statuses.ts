const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Codeium',
    },
  });

  // Create super admin user
  const hashedPassword = await hash('password123', 12);
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Mathew Torres',
      email: 'torres.mathew@gmail.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      orgId: organization.id,
      points: 0,
      totalEarned: 0,
    },
  });

  // Create default statuses for your organization
  const defaultStatuses = [
    {
      name: 'Pending',
      color: '#94A3B8',
      description: 'New referral awaiting review',
      isDefault: true,
      isSystem: true,
      order: 0,
    },
    {
      name: 'Contacted',
      color: '#3B82F6',
      description: 'Initial contact made with referral',
      isSystem: true,
      order: 1,
    },
    {
      name: 'In Progress',
      color: '#10B981',
      description: 'Actively working with referral',
      isSystem: true,
      order: 2,
    },
    {
      name: 'Converted',
      color: '#059669',
      description: 'Referral has become a customer',
      isSystem: true,
      order: 3,
    },
    {
      name: 'Not Interested',
      color: '#EF4444',
      description: 'Referral declined to proceed',
      isSystem: true,
      order: 4,
    },
  ];

  // Create statuses
  const createdStatuses = await Promise.all(
    defaultStatuses.map((status) =>
      prisma.referralStatus.create({
        data: {
          ...status,
          organization: {
            connect: { id: organization.id },
          },
        },
      })
    )
  );

  console.log('Successfully created organization, super admin, and default statuses');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
