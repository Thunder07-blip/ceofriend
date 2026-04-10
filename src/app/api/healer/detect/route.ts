// ============================================================
// CEOfriend — API Route: POST /api/healer/detect
// Fetches file content, detects bug, generates fix, returns diff.
// ============================================================

import { NextRequest } from "next/server";
import { fetchFileContent } from "@/services/githubService";
import { healFile } from "@/modules/healerAgent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, filePath } = await request.json();

    if (!owner || !repo || !filePath) {
      return Response.json(
        { success: false, error: "Missing required fields: owner, repo, filePath" },
        { status: 400 }
      );
    }

    // Check auth to fetch file content on user's behalf if available
    const session = await getServerSession(authOptions);
    // @ts-expect-error - accessToken is populated in nextauth callback
    const token = session?.accessToken as string | undefined;

    // 1. Fetch file content from GitHub
    const fileData = await fetchFileContent(owner, repo, filePath, token);
    if (!fileData) {
      return Response.json(
        { success: false, error: `Could not fetch file: ${filePath}` },
        { status: 404 }
      );
    }

    // 2. Skip very large files
    const lineCount = fileData.content.split("\n").length;
    if (lineCount > 3000) {
      return Response.json(
        { success: false, error: `File too large (${lineCount} lines). Max 3000 lines.` },
        { status: 400 }
      );
    }

    // 3. Detect bug + generate fix + diff
    const result = await healFile(fileData.content, filePath);

    if (!result) {
      return Response.json({
        success: true,
        data: { noBug: true, file: filePath, message: "No critical bugs detected in this file." },
      });
    }

    return Response.json({
      success: true,
      data: {
        noBug: false,
        file: result.file,
        original: result.original,
        patched: result.patched,
        bug: result.bug,
        diff: result.diff,
        sha: fileData.sha,
      },
    });
  } catch (err) {
    console.error("[Healer Detect API] Error:", err);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
