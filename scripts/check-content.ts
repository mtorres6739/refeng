const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const content = await prisma.contentItem.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log('All content items:', JSON.stringify(content, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
