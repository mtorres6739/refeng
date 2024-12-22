const { PrismaClient, UserRole, DrawingStatus, DrawingEntryType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create organizations
    const organizations = await Promise.all([
      prisma.organization.create({
        data: {
          name: 'Tech Corp',
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
        },
      }),
      prisma.organization.create({
        data: {
          name: 'Marketing Pro',
          address: '456 Market Street',
          city: 'New York',
          state: 'NY',
          zip: '10001',
        },
      }),
    ]);

    console.log('Created organizations:', organizations);

    // Create users for each organization
    const users = [];
    for (const org of organizations) {
      // Create admin
      const adminPassword = await bcrypt.hash('password123', 10);
      const admin = await prisma.user.create({
        data: {
          name: `${org.name} Admin`,
          email: `admin@${org.name.toLowerCase().replace(' ', '')}.com`,
          password: adminPassword,
          role: UserRole.ADMIN,
          orgId: org.id,
          points: 1000,
        },
      });
      users.push(admin);

      // Create regular users
      const userPassword = await bcrypt.hash('password123', 10);
      for (let i = 1; i <= 3; i++) {
        const user = await prisma.user.create({
          data: {
            name: `${org.name} User ${i}`,
            email: `user${i}@${org.name.toLowerCase().replace(' ', '')}.com`,
            password: userPassword,
            role: UserRole.CLIENT,
            orgId: org.id,
            points: Math.floor(Math.random() * 1000),
          },
        });
        users.push(user);
      }
    }

    console.log('Created users:', users);

    // Create referral programs for each organization
    const programs = [];
    for (const org of organizations) {
      const program = await prisma.referralProgram.create({
        data: {
          name: `${org.name} Referral Program`,
          description: 'Earn points by referring new customers',
          pointsValue: 100,
          isActive: true,
          orgId: org.id,
        },
      });
      programs.push(program);
    }

    console.log('Created referral programs:', programs);

    // Create referral statuses for each organization
    for (const org of organizations) {
      const statuses = [
        {
          name: 'Pending',
          color: '#94A3B8',
          description: 'New referral awaiting review',
          isDefault: true,
          isSystem: true,
          order: 0,
          orgId: org.id,
        },
        {
          name: 'Contacted',
          color: '#3B82F6',
          description: 'Initial contact made with referral',
          isSystem: true,
          order: 1,
          orgId: org.id,
        },
        {
          name: 'In Progress',
          color: '#10B981',
          description: 'Actively working with referral',
          isSystem: true,
          order: 2,
          orgId: org.id,
        },
      ];

      await Promise.all(
        statuses.map((status) => prisma.referralStatus.create({ data: status }))
      );
    }

    // Create referrals for each user
    const referrals = [];
    for (const user of users) {
      const status = await prisma.referralStatus.findFirst({
        where: { orgId: user.orgId },
      });

      if (!status) continue;

      for (let i = 1; i <= 2; i++) {
        const referral = await prisma.referral.create({
          data: {
            name: `Referral ${i} from ${user.name}`,
            email: `referral${i}${user.email}`,
            phone: `555-000${i}`,
            userId: user.id,
            orgId: user.orgId,
            statusId: status.id,
            pointsAwarded: Math.random() > 0.5 ? 100 : 0,
            programId: programs.find((p) => p.orgId === user.orgId)?.id,
          },
        });
        referrals.push(referral);
      }
    }

    console.log('Created referrals:', referrals);

    // Create content for each organization
    const content = [];
    for (const org of organizations) {
      const contentItems = [
        {
          title: 'Product Overview',
          description: 'Learn about our amazing products',
          type: 'video',
          url: 'https://example.com/product-video',
          orgId: org.id,
        },
        {
          title: 'Customer Success Story',
          description: 'See how our customers succeed',
          type: 'pdf',
          url: 'https://example.com/success-story.pdf',
          orgId: org.id,
        },
      ];

      for (const item of contentItems) {
        const contentItem = await prisma.content.create({
          data: item,
        });
        content.push(contentItem);
      }
    }

    console.log('Created content:', content);

    // Create shares for content
    const shares = [];
    for (const user of users) {
      const orgContent = content.filter((c) => c.orgId === user.orgId);
      for (const item of orgContent) {
        const share = await prisma.share.create({
          data: {
            userId: user.id,
            contentId: item.id,
            platform: Math.random() > 0.5 ? 'twitter' : 'linkedin',
          },
        });
        shares.push(share);
      }
    }

    console.log('Created shares:', shares);

    // Create drawings for each organization
    const drawings = [];
    for (const org of organizations) {
      const drawing = await prisma.drawing.create({
        data: {
          name: `${org.name} Holiday Giveaway`,
          description: 'Win amazing prizes this holiday season',
          prize: 'Latest iPad Pro',
          prizeDetails: '12.9-inch, 256GB, Space Gray',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          drawDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 31 days from now
          status: DrawingStatus.ACTIVE,
          rules: 'Must be 18 or older to participate',
          minEntries: 1,
          maxEntries: 100,
          orgId: org.id,
          createdById: users.find((u) => u.orgId === org.id && u.role === UserRole.ADMIN)?.id || '',
        },
      });
      drawings.push(drawing);
    }

    console.log('Created drawings:', drawings);

    // Create drawing entries
    const entries = [];
    for (const drawing of drawings) {
      const orgUsers = users.filter((u) => u.orgId === drawing.orgId);
      for (const user of orgUsers) {
        const entry = await prisma.drawingEntry.create({
          data: {
            drawingId: drawing.id,
            userId: user.id,
            entryType: DrawingEntryType.MANUAL,
            quantity: Math.floor(Math.random() * 5) + 1,
          },
        });
        entries.push(entry);
      }
    }

    console.log('Created drawing entries:', entries);

    console.log('Sample data creation completed successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
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
