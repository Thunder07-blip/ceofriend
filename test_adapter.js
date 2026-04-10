require("dotenv").config();
const { Pool } = require("@neondatabase/serverless");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { PrismaClient } = require("./src/generated/prisma/client");
const { PrismaAdapter } = require("@next-auth/prisma-adapter");
const ws = require("ws");

// Required for neon websocket constructor in node
const { neonConfig } = require("@neondatabase/serverless");
neonConfig.webSocketConstructor = ws;

async function test() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });
  
  const nextAuthAdapter = PrismaAdapter(prisma);

  try {
    console.log("Testing getUserByAccount...");
    const res = await nextAuthAdapter.getUserByAccount({ providerAccountId: '191848485', provider: 'github' });
    console.log("Success! Result:", res);
  } catch (e) {
    console.error("CRASH:", e);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

test();
