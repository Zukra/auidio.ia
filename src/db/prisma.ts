import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/db/generated/prisma/client';

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL ?? '';
const adapter = new PrismaBetterSqlite3({ url: connectionString });

export const prisma =  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
