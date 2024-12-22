const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

interface ReferralStatus {
  id: string;
  name: string;
  color: string;
  description: string;
  order: number;
  isDefault: boolean;
  isSystem: boolean;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

async function main() {
  try {
    // Delete existing data
    console.log('Cleaning up existing data...');
    await prisma.referral.deleteMany({});
    await prisma.referralProgram.deleteMany({});
    await prisma.drawing.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log('Existing data cleaned up');

    // Create organization
    console.log('Creating organization...');
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
      },
    });
    console.log('Organization created:', organization);

    // Create referral statuses
    console.log('Creating referral statuses...');
    const statusData = [
      {
        name: 'Pending',
        color: '#94A3B8',
        description: 'New referral, not yet contacted',
        order: 0,
        isDefault: true,
        isSystem: true,
      },
      {
        name: 'Contacted',
        color: '#3B82F6',
        description: 'Initial contact made',
        order: 1,
        isSystem: true,
      },
      {
        name: 'Qualified',
        color: '#10B981',
        description: 'Referral has been qualified',
        order: 2,
        isSystem: true,
      },
      {
        name: 'Converted',
        color: '#059669',
        description: 'Referral has converted',
        order: 3,
        isSystem: true,
      },
      {
        name: 'Not Interested',
        color: '#EF4444',
        description: 'Referral is not interested',
        order: 4,
        isSystem: true,
      },
    ];

    const statuses: Record<string, ReferralStatus> = {};
    for (const data of statusData) {
      const status = await prisma.referralStatus.create({
        data: {
          ...data,
          organization: {
            connect: {
              id: organization.id,
            },
          },
        },
      });
      statuses[data.name] = status;
      console.log('Status created:', status);
    }

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        points: 0,
        totalEarned: 0,
        orgId: organization.id,
      },
    });
    console.log('Admin user created:', adminUser);

    // Create referral program
    console.log('Creating test referral program...');
    const referralProgram = await prisma.referralProgram.create({
      data: {
        name: 'Standard Referral Program',
        description: 'Our standard referral program',
        pointsValue: 100,
        isActive: true,
        orgId: organization.id,
      },
    });
    console.log('Referral program created:', referralProgram);

    // Create test referrals
    console.log('Creating test referrals...');
    const referralData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        status: 'Pending',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '234-567-8901',
        status: 'Contacted',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '345-678-9012',
        status: 'Qualified',
      },
    ];

    for (const data of referralData) {
      const { status: statusName, ...referralInfo } = data;
      const referral = await prisma.referral.create({
        data: {
          ...referralInfo,
          pointsAwarded: 0,
          organization: {
            connect: {
              id: organization.id,
            },
          },
          status: {
            connect: {
              id: statuses[statusName].id,
            },
          },
          referredBy: {
            connect: {
              id: adminUser.id,
            },
          },
          program: {
            connect: {
              id: referralProgram.id,
            },
          },
        },
      });
      console.log('Referral created:', referral);
    }

    // Create test drawings
    console.log('Creating test drawings...');
    const drawingData = [
      {
        name: 'Monthly Prize Draw',
        description: 'Win a $100 gift card!',
        prize: '$100 Gift Card',
        prizeDetails: 'Amazon gift card',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        drawDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 31 days from now
        status: 'ACTIVE',
        rules: 'Must have at least one referral to enter',
        minEntries: 1,
        maxEntries: 10,
        organization: {
          connect: {
            id: organization.id,
          },
        },
        createdBy: {
          connect: {
            id: adminUser.id,
          },
        },
      },
      {
        name: 'Quarterly Grand Prize',
        description: 'Win a new iPhone!',
        prize: 'iPhone 15',
        prizeDetails: 'Latest iPhone model',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        drawDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000), // 91 days from now
        status: 'DRAFT',
        rules: 'Must have at least three referrals to enter',
        minEntries: 1,
        maxEntries: 20,
        organization: {
          connect: {
            id: organization.id,
          },
        },
        createdBy: {
          connect: {
            id: adminUser.id,
          },
        },
      },
    ];

    for (const data of drawingData) {
      const drawing = await prisma.drawing.create({
        data,
      });
      console.log('Drawing created:', drawing);
    }

    console.log('Test data setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
