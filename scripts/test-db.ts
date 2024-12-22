const { prisma } = require('../src/lib/prisma');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // Try to get a user with all relations
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        referrals: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            email: true,
            status: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            pointsAwarded: true,
            createdAt: true,
            convertedAt: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        rewards: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            pointsCost: true,
            createdAt: true,
          },
        },
        drawingEntries: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            createdAt: true,
            drawing: {
              select: {
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });
    
    console.log('Successfully queried user with relations:', 
      JSON.stringify(users[0], null, 2)
    );
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
