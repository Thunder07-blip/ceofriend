const { PrismaClient } = require("./src/generated/prisma/client");
const { neon, Pool } = require("@neondatabase/serverless");
const { PrismaNeon } = require("@prisma/adapter-neon");
const ws = require("ws");

async function main() {
  const { config } = require("dotenv");
  config();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No URL");

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

  // Initialize
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst();
    console.log("DB Test success. User query result:", user);
  } catch (err) {
    console.error("DB Test Failed:", err);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

main();
