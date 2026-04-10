// ============================================================
// CEOfriend — Prisma Client Singleton (Prisma 7 + Neon)
// Uses @prisma/adapter-neon with Pool to connect to Neon.tech
// without requiring Prisma Accelerate.
// ============================================================

import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  // Type assertion handles slight type mismatches between 
  // @neondatabase/serverless versions.
  const adapter = new PrismaNeon(pool as any);

  return new PrismaClient({ adapter } as never);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
