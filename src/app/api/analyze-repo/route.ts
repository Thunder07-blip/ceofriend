// ============================================================
// CEOfriend — API Route: POST /api/analyze-repo
// Entry point for the analysis pipeline.
// ============================================================

import { NextRequest } from "next/server";
import { orchestrate } from "@/lib/orchestrator";
import { parseRepoUrl } from "@/lib/utils";

export const maxDuration = 60; // Allow up to 60s for analysis

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, companyContext } = body;

    // Validate input
    if (!repoUrl || typeof repoUrl !== "string") {
      return Response.json(
        { success: false, error: "Missing or invalid 'repoUrl' field", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    // Validate URL format
    const parsed = parseRepoUrl(repoUrl.trim());
    if (!parsed) {
      return Response.json(
        { success: false, error: "Invalid GitHub repository URL. Expected format: https://github.com/owner/repo", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    // Run the pipeline
    const result = await orchestrate(repoUrl.trim(), companyContext || null);

    return Response.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (err) {
    console.error("[API] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json(
      { success: false, error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    { success: true, message: "CEOfriend API is running. Use POST to analyze a repository.", endpoint: "/api/analyze-repo" },
    { status: 200 }
  );
}
