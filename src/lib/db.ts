// ============================================================
// CEOfriend — Prisma Client Singleton
// Uses @prisma/adapter-pg to securely connect over standard TCP
// bypassing Prisma 7's Edge requirements and Neon websocket hangs.
// ============================================================

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL || "";
  
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      console.error("DATABASE_URL is not defined in production environment.");
    } else {
      console.warn("DATABASE_URL is not defined during local Prisma instantiation.");
    }
  }

  // Force PgBouncer compatibility for Prisma on Neon pooler URLs
  if (connectionString && connectionString.includes("pooler") && !connectionString.includes("pgbouncer=true")) {
    connectionString = connectionString + (connectionString.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";
  }

  // Use native pg pool instead of neon web sockets
  const pool = new Pool({ connectionString: connectionString || "postgresql://invalid" });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ 
    adapter,
    log: ["warn", "error"]
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
