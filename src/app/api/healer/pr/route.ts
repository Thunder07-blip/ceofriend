// ============================================================
// CEOfriend — API Route: POST /api/healer/pr
// Creates a GitHub branch, commits patched code, opens a PR.
// ============================================================

import { NextRequest } from "next/server";
import { createBranchAndPR } from "@/services/githubService";

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, filePath, patchedContent, fileSha, bugType } = await request.json();

    if (!owner || !repo || !filePath || !patchedContent || !fileSha || !bugType) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createBranchAndPR(owner, repo, filePath, patchedContent, fileSha, bugType);

    return Response.json({
      success: true,
      data: {
        prUrl: result.prUrl,
        branchName: result.branchName,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Healer PR API] Error:", message);
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
