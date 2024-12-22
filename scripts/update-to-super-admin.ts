import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'torres.mathew@gmail.com'; // Your email

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
  });

  console.log('Updated user:', {
    id: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
