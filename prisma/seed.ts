import { PrismaClient, UserRole, ContentType, SharePlatform, NotificationType, DrawingStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create organizations
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Acme Corporation',
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Stark Industries',
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Wayne Enterprises',
      },
    }),
  ]);

  console.log('Created organizations:', organizations.map(org => org.name));

  // Create users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    // Super Admin
    prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Mathew Torres',
        email: 'torres.mathew@gmail.com',
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        orgId: organizations[0].id,
      },
    }),
    // Admin Users
    prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john@acme.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        orgId: organizations[0].id,
      },
    }),
    prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Tony Stark',
        email: 'tony@stark.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        orgId: organizations[1].id,
      },
    }),
    // Regular Users
    prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        role: UserRole.CLIENT,
        orgId: organizations[0].id,
      },
    }),
  ]);

  console.log('Created users:', users.map(user => user.email));

  // Create referral statuses
  const statuses = await Promise.all([
    prisma.referralStatus.create({
      data: {
        name: 'New',
        color: '#3B82F6', // Blue
        description: 'New referral',
        order: 0,
        isDefault: true,
        isSystem: true,
      },
    }),
    prisma.referralStatus.create({
      data: {
        name: 'In Progress',
        color: '#F59E0B', // Yellow
        description: 'Referral is being processed',
        order: 1,
        isDefault: false,
        isSystem: true,
      },
    }),
    prisma.referralStatus.create({
      data: {
        name: 'Converted',
        color: '#10B981', // Green
        description: 'Referral has been converted',
        order: 2,
        isDefault: false,
        isSystem: true,
      },
    }),
    prisma.referralStatus.create({
      data: {
        name: 'Closed',
        color: '#EF4444', // Red
        description: 'Referral has been closed',
        order: 3,
        isDefault: false,
        isSystem: true,
      },
    }),
  ]);

  console.log('Created referral statuses');

  // Create sample content
  const content = await Promise.all([
    // Acme Corporation Content
    prisma.content.create({
      data: {
        title: 'Product Overview',
        description: 'A comprehensive overview of our product line',
        type: ContentType.VIDEO,
        url: 'https://example.com/docs/product-overview.pdf',
        thumbnail: 'https://example.com/thumbnails/product-overview.jpg',
        points: 100,
        userId: users[1].id, // John Doe
        orgId: organizations[0].id,
      },
    }),
    prisma.content.create({
      data: {
        title: 'Customer Success Story',
        description: 'How we helped XYZ company achieve their goals',
        type: ContentType.VIDEO,
        url: 'https://example.com/videos/success-story.mp4',
        thumbnail: 'https://example.com/thumbnails/success-story.jpg',
        points: 150,
        userId: users[1].id,
        orgId: organizations[0].id,
      },
    }),
    // Stark Industries Content
    prisma.content.create({
      data: {
        title: 'Innovation Showcase',
        description: 'Latest technological breakthroughs',
        type: ContentType.VIDEO,
        url: 'https://example.com/videos/innovation.mp4',
        thumbnail: 'https://example.com/thumbnails/innovation.jpg',
        points: 200,
        userId: users[2].id, // Tony Stark
        orgId: organizations[1].id,
      },
    }),
  ]);

  console.log('Created content items');

  // Create content shares
  await Promise.all([
    prisma.contentShare.create({
      data: {
        contentId: content[0].id,
        userId: users[3].id, // Jane Smith
        platform: SharePlatform.LINKEDIN,
        shareUrl: 'https://linkedin.com/share/123',
        trackingId: uuidv4(),
        clicks: 45,
        engagements: 12,
      },
    }),
    prisma.contentShare.create({
      data: {
        contentId: content[1].id,
        userId: users[3].id,
        platform: SharePlatform.TWITTER,
        shareUrl: 'https://twitter.com/share/456',
        trackingId: uuidv4(),
        clicks: 89,
        engagements: 34,
      },
    }),
  ]);

  console.log('Created content shares');

  // Create sample referrals
  const referrals = await Promise.all([
    prisma.referral.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1234567890',
        notes: {
          create: {
            content: 'Interested in enterprise solution',
            userId: users[3].id,
          }
        },
        pointsAwarded: 100,
        userId: users[3].id, // Jane Smith
        orgId: organizations[0].id,
        statusId: statuses[0].id, // New
      },
    }),
    prisma.referral.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1987654321',
        notes: {
          create: {
            content: 'Looking for custom implementation',
            userId: users[3].id,
          }
        },
        pointsAwarded: 150,
        userId: users[3].id,
        orgId: organizations[0].id,
        statusId: statuses[1].id, // In Progress
      },
    }),
    prisma.referral.create({
      data: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        notes: {
          create: {
            content: 'Requires immediate follow-up',
            userId: users[1].id,
          }
        },
        pointsAwarded: 0,
        userId: users[1].id, // John Doe
        orgId: organizations[0].id,
        statusId: statuses[0].id, // New
      },
    }),
  ]);

  console.log('Created referrals');

  // Create sample drawings
  const drawings = await Promise.all([
    prisma.drawing.create({
      data: {
        name: 'Holiday Giveaway',
        description: 'Win amazing prizes this holiday season!',
        prize: 'iPhone 15 Pro',
        prizeDetails: 'Latest iPhone model with 256GB storage',
        rules: 'One entry per referral. Must be 18 or older to participate.',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        drawDate: new Date('2025-01-05'),
        minEntries: 10,
        maxEntries: 1000,
        status: DrawingStatus.ACTIVE,
        orgId: organizations[0].id,
        createdById: users[1].id, // John Doe
      },
    }),
    prisma.drawing.create({
      data: {
        name: 'Tech Innovation Contest',
        description: 'Participate to win cutting-edge tech gadgets!',
        prize: 'Gaming PC Setup',
        prizeDetails: 'High-end gaming PC with peripherals',
        rules: 'Must have at least one successful referral to enter.',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2025-01-15'),
        drawDate: new Date('2025-01-20'),
        minEntries: 5,
        maxEntries: 500,
        status: DrawingStatus.ACTIVE,
        orgId: organizations[1].id,
        createdById: users[2].id, // Tony Stark
      },
    }),
  ]);

  console.log('Created drawings');

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        title: 'Points Earned',
        message: 'You earned 100 points for your referral',
        type: NotificationType.POINTS_EARNED,
        userId: users[1].id, // John Doe
        data: {
          points: 100,
          referralId: referrals[0].id,
        },
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Referral Converted',
        message: 'Your referral has been successfully converted',
        type: NotificationType.REFERRAL_CONVERTED,
        userId: users[1].id,
        data: {
          referralId: referrals[1].id,
        },
      },
    }),
  ]);

  console.log('Created notifications');
  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
