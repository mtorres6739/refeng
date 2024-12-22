import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'torres.mathew@gmail.com';
  const plainPassword = 'password123';

  // Step 1: Hash the password
  console.log('Step 1: Hashing password...');
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log('Hashed password:', hashedPassword);

  // Step 2: Update the user
  console.log('\nStep 2: Updating user...');
  const user = await prisma.user.update({
    where: { email },
    data: { 
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Updated user:', {
    id: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  });

  // Step 3: Test the password
  console.log('\nStep 3: Testing password...');
  const isValid = await bcrypt.compare(plainPassword, user.password);
  console.log('Password test:', {
    plainPassword,
    hashedPassword: user.password,
    isValid,
  });

  console.log('\nIf successful, try logging in with:');
  console.log('Email:', email);
  console.log('Password:', plainPassword);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
