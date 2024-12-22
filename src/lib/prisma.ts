import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  });

export default prisma;
