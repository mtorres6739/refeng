import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'torres.mathew@gmail.com';
  const testPassword = 'password123';

  // Get the user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    role: user.role,
    hashedPassword: user.password,
  });

  // Test password comparison
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('Password comparison:', {
    inputPassword: testPassword,
    isValid,
  });

  // Generate a new hash for comparison
  const newHash = await bcrypt.hash(testPassword, 10);
  console.log('New hash comparison:', {
    storedHash: user.password,
    newHash,
    hashesMatch: user.password === newHash,
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
