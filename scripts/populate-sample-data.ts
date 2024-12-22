const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up existing data...');
  
  // Delete in correct order to handle foreign key constraints
  await prisma.drawingEntry.deleteMany({});
  await prisma.drawing.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.referralProgram.deleteMany({});
  await prisma.referralStatus.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  console.log('Cleanup completed');
}

async function main() {
  try {
    // Clean up existing data first
    await cleanup();

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: 'Sample Company',
      },
    });

    console.log('Created organization:', org);

    // Create test user first to match current login
    const testUser = await prisma.user.create({
      data: {
        name: 'Mathew Torres',
        email: 'torres.mathew@gmail.com',
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
        orgId: org.id,
      },
    });

    console.log('Created test user:', testUser);

    // Create default statuses
    const statuses = await Promise.all([
      prisma.referralStatus.create({
        data: {
          name: 'Pending',
          color: '#FFA500',
          description: 'Referral has been submitted but not yet contacted',
          order: 1,
          isDefault: true,
          isSystem: true,
          orgId: org.id,
        },
      }),
      prisma.referralStatus.create({
        data: {
          name: 'Contacted',
          color: '#4169E1',
          description: 'Initial contact has been made',
          order: 2,
          isDefault: false,
          isSystem: true,
          orgId: org.id,
        },
      }),
      prisma.referralStatus.create({
        data: {
          name: 'In Progress',
          color: '#32CD32',
          description: 'Actively working with the referral',
          order: 3,
          isDefault: false,
          isSystem: true,
          orgId: org.id,
        },
      }),
      prisma.referralStatus.create({
        data: {
          name: 'Converted',
          color: '#008000',
          description: 'Referral has been successfully converted',
          order: 4,
          isDefault: false,
          isSystem: true,
          orgId: org.id,
        },
      }),
    ]);

    console.log('Created statuses:', statuses);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        orgId: org.id,
      },
    });

    console.log('Created admin user:', admin);

    // Create regular users
    const userPassword = await bcrypt.hash('password123', 10);
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: userPassword,
          role: 'CLIENT',
          orgId: org.id,
        },
      }),
      prisma.user.create({
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: userPassword,
          role: 'CLIENT',
          orgId: org.id,
        },
      }),
    ]);

    console.log('Created regular users:', users);

    // Create referral programs
    const programs = await Promise.all([
      prisma.referralProgram.create({
        data: {
          name: 'Standard Referral',
          description: 'Our standard referral program',
          pointsValue: 100,
          orgId: org.id,
        },
      }),
      prisma.referralProgram.create({
        data: {
          name: 'Premium Referral',
          description: 'Premium referral with higher rewards',
          pointsValue: 200,
          orgId: org.id,
        },
      }),
    ]);

    console.log('Created referral programs:', programs);

    // Create referrals
    const referrals = await Promise.all([
      // Referrals for John
      prisma.referral.create({
        data: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '123-456-7890',
          statusId: statuses[0].id, // Pending
          pointsAwarded: programs[0].pointsValue,
          userId: users[0].id,
          orgId: org.id,
          programId: programs[0].id,
          notes: {
            create: {
              content: 'Initial contact attempt made',
              userId: users[0].id,
            },
          },
        },
      }),
      prisma.referral.create({
        data: {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          phone: '123-456-7891',
          statusId: statuses[2].id, // In Progress
          pointsAwarded: programs[1].pointsValue,
          userId: users[0].id,
          orgId: org.id,
          programId: programs[1].id,
          notes: {
            create: {
              content: 'Scheduled follow-up meeting',
              userId: users[0].id,
            },
          },
        },
      }),
      // Referrals for Jane
      prisma.referral.create({
        data: {
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          phone: '123-456-7892',
          statusId: statuses[1].id, // Contacted
          pointsAwarded: programs[0].pointsValue,
          userId: users[1].id,
          orgId: org.id,
          programId: programs[0].id,
          notes: {
            create: {
              content: 'Very interested in our services',
              userId: users[1].id,
            },
          },
        },
      }),
      prisma.referral.create({
        data: {
          name: 'David Miller',
          email: 'david@example.com',
          phone: '123-456-7893',
          statusId: statuses[3].id, // Converted
          pointsAwarded: programs[1].pointsValue,
          userId: users[1].id,
          orgId: org.id,
          programId: programs[1].id,
          convertedAt: new Date(),
          notes: {
            create: {
              content: 'Successfully converted!',
              userId: users[1].id,
            },
          },
        },
      }),
    ]);

    console.log('Created referrals:', referrals);

    // Create content items
    const content = await Promise.all([
      prisma.content.create({
        data: {
          title: 'Referral Best Practices',
          description: 'Learn how to make effective referrals',
          type: 'ARTICLE',
          url: 'https://example.com/best-practices',
          orgId: org.id,
        },
      }),
      prisma.content.create({
        data: {
          title: 'Program Overview',
          description: 'Overview of our referral programs',
          type: 'ARTICLE',
          url: 'https://example.com/program-overview',
          orgId: org.id,
        },
      }),
    ]);

    console.log('Created content:', content);

    // Create drawings
    const drawings = await Promise.all([
      prisma.drawing.create({
        data: {
          name: 'Q4 Bonus Drawing',
          description: 'Special year-end bonus drawing',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-30'),
          pointsCost: 500,
          isActive: true,
          orgId: org.id,
        },
      }),
      prisma.drawing.create({
        data: {
          name: 'Monthly Prize Draw',
          description: 'Regular monthly prize drawing',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-30'),
          pointsCost: 100,
          isActive: true,
          orgId: org.id,
        },
      }),
    ]);

    console.log('Created drawings:', drawings);

    // Create drawing entries
    const entries = await Promise.all([
      prisma.drawingEntry.create({
        data: {
          drawingId: drawings[0].id,
          userId: users[0].id,
          pointsCost: drawings[0].pointsCost,
          isWinner: false,
        },
      }),
      prisma.drawingEntry.create({
        data: {
          drawingId: drawings[0].id,
          userId: users[1].id,
          pointsCost: drawings[0].pointsCost,
          isWinner: false,
        },
      }),
      prisma.drawingEntry.create({
        data: {
          drawingId: drawings[1].id,
          userId: users[0].id,
          pointsCost: drawings[1].pointsCost,
          isWinner: true,
        },
      }),
    ]);

    console.log('Created drawing entries:', entries);

    console.log('Sample data population completed successfully!');
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
    await prisma.$disconnect();
  });
