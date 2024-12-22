import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'torres.mathew@gmail.com'; // Your email
  const newPassword = 'password123'; // New password

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('Updated user:', {
    id: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
    passwordLength: user.password.length,
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
