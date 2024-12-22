const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all organizations
  const orgs = await prisma.organization.findMany();
  console.log('\nOrganizations:', orgs);

  // Get all content items
  const content = await prisma.contentItem.findMany({
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
  
  console.log('\nContent items:', JSON.stringify(content, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
