const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all content items
  const content = await prisma.contentItem.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          orgId: true,
        },
      },
    },
  });
  
  console.log('\nAll content items:', JSON.stringify(content, null, 2));

  // Get content for specific org
  const orgContent = await prisma.contentItem.findMany({
    where: {
      orgId: 'cm4yg8hrl0000ixs0m6fhp5dl'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log('\nContent for org cm4yg8hrl0000ixs0m6fhp5dl:', JSON.stringify(orgContent, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
