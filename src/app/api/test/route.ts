import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, count: userCount, message: "Database connection successful!" });
  } catch (error: any) {
    if (error.message.includes("No database host or connection string")) {
      return NextResponse.json({ 
        success: false, 
        error: "PRISMA_CRASH", 
        message: "No database host or connection string. The NEXT_PUBLIC or DATABASE_URL env var is not loaded." 
      }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
