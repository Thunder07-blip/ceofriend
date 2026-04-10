// ============================================================
// CEOfriend — API Route: POST /api/healer/pr
// Creates a GitHub branch, commits patched code, opens a PR.
// Uses the authenticated user's token from NextAuth session.
// ============================================================

import { NextRequest } from "next/server";
import { createBranchAndPR } from "@/services/githubService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the user's GitHub token from their NextAuth session
    const session = await getServerSession(authOptions);
    // @ts-expect-error - accessToken is populated in nextauth jwt callback
    const token = session?.accessToken as string | undefined;

    if (!token) {
      return Response.json(
        { success: false, error: "Unauthorized. Please login with GitHub first." },
        { status: 401 }
      );
    }

    const { owner, repo, filePath, patchedContent, fileSha, bugType } = await request.json();

    if (!owner || !repo || !filePath || !patchedContent || !fileSha || !bugType) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createBranchAndPR(owner, repo, filePath, patchedContent, fileSha, bugType, token);

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
