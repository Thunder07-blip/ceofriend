// test_nativ.js
const { PrismaClient } = require('./src/generated/prisma/client');
require('dotenv').config();

async function main() {
  const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
  console.log("Connecting...");
  try {
    const user = await prisma.user.findFirst();
    console.log("Success! user:", user);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
