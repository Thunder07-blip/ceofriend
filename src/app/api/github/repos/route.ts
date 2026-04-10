// ============================================================
// CEOfriend — API Route: GET /api/github/repos
// Fetches authenticated user's repositories via GitHub OAuth.
// ============================================================

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error - accessToken is populated in nextauth callback
    const token = session?.accessToken as string | undefined;

    if (!token) {
      return Response.json(
        { error: "Unauthorized. Please login with GitHub first." },
        { status: 401 }
      );
    }

    // Fetch up to 100 repos, sorted by most recently pushed
    const res = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=pushed&direction=desc",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        // Don't cache — always fetch fresh
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[GitHub Repos API] GitHub returned error:", res.status, errText);
      return Response.json(
        { error: `GitHub API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Map to lean shape for the frontend
    const repos = data.map((repo: Record<string, unknown>) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || "",
      private: repo.private,
      stars: repo.stargazers_count,
      language: repo.language || null,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      permissions: repo.permissions,
    }));

    return Response.json(repos);
  } catch (err) {
    console.error("[GitHub Repos API] Error:", err);
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
