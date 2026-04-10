// ============================================================
// CEOfriend â€” GitHub Service
// Fetches commits, issues, contributors from GitHub REST API
// Graceful error handling: retries, partial data, rate limit awareness
// ============================================================

import { logger } from "@/lib/utils";

const GITHUB_API = "https://api.github.com";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CEOfriend-Platform",
  };

  const token = process.env.github_fine_grained;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch with retry and error handling.
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: getHeaders() });

      // Rate limit handling
      if (res.status === 403) {
        const remaining = res.headers.get("X-RateLimit-Remaining");
        if (remaining === "0") {
          logger.warn("GitHub", "Rate limit exceeded. Returning partial data.");
          return null;
        }
      }

      if (res.status === 404) {
        logger.warn("GitHub", `Resource not found: ${url}`);
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (err) {
      if (attempt < retries) {
        logger.warn("GitHub", `Retry ${attempt + 1}/${retries} for ${url}`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      } else {
        logger.error("GitHub", `Failed after ${retries + 1} attempts: ${url}`, err);
        return null;
      }
    }
  }
  return null;
}

/**
 * Fetch paginated results (up to maxPages).
 */
async function fetchPaginated<T>(url: string, maxPages = 3): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const separator = url.includes("?") ? "&" : "?";
    const res = await fetchWithRetry(`${url}${separator}per_page=100&page=${page}`);
    if (!res) break;

    const data = (await res.json()) as T[];
    if (!Array.isArray(data) || data.length === 0) break;

    results.push(...data);
    page++;
  }

  return results;
}

// ---- GitHub API response types (partial) ----

interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string; name?: string };
  };
  files?: { filename: string }[];
}

interface GHIssue {
  number: number;
  title: string;
  labels: { name: string }[];
  state: string;
  body?: string;
}

interface GHContributor {
  login: string;
  contributions: number;
}

interface GHContent {
  name: string;
  path: string;
  type: string;
  size?: number;
}

// ---- Public API ----

/**
 * Fetch exact commit statistics for a specific file.
 * We fetch 1 page (up to 100 commits) which is mathematically plenty for our model.
 */
export async function fetchFileStats(
  owner: string,
  repo: string,
  path: string
): Promise<{
  commits: number;
  recentCommits: number;
  contributors: number;
}> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits?path=${path}&per_page=100`;
  const res = await fetchWithRetry(url);

  if (!res) {
    return { commits: 0, recentCommits: 0, contributors: 1 }; // Safe fallback
  }

  const commitsArray = (await res.json()) as GHCommit[];
  if (!Array.isArray(commitsArray) || commitsArray.length === 0) {
    return { commits: 0, recentCommits: 0, contributors: 1 };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let recentCommits = 0;
  const uniqueAuthors = new Set<string>();

  for (const c of commitsArray) {
    if (c.commit?.author?.date) {
      if (new Date(c.commit.author.date) >= thirtyDaysAgo) {
        recentCommits++;
      }
    }
    
    // Add author login (or generic name if login missing) to count unique contributors
    // Actual API has c.author?.login, but we fallback to commit author name
    const authorId = (c as any).author?.login || c.commit?.author?.name || "unknown";
    uniqueAuthors.add(authorId as string);
  }

  return {
    commits: commitsArray.length,
    recentCommits,
    contributors: Math.max(1, uniqueAuthors.size),
  };
}

/**
 * Fetch issues labeled as "bug" (or containing "bug" in title).
 */
export async function fetchIssues(
  owner: string,
  repo: string
): Promise<{
  bugsByFile: Map<string, number>;
  totalBugs: number;
}> {
  logger.step("GitHub", `Fetching issues for ${owner}/${repo}`);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&labels=bug`;
  const bugIssues = await fetchPaginated<GHIssue>(url, 2);

  // Also fetch issues without label but with "bug" in title
  const allUrl = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all`;
  const allIssues = await fetchPaginated<GHIssue>(allUrl, 2);

  const titleBugs = allIssues.filter(
    (issue) =>
      issue.title.toLowerCase().includes("bug") ||
      issue.title.toLowerCase().includes("fix") ||
      issue.title.toLowerCase().includes("error") ||
      issue.title.toLowerCase().includes("crash")
  );

  // Merge and deduplicate
  const allBugs = new Map<number, GHIssue>();
  for (const issue of [...bugIssues, ...titleBugs]) {
    allBugs.set(issue.number, issue);
  }

  const bugsByFile = new Map<string, number>();

  // Attempt to map bugs to files by checking issue body for file references
  for (const issue of allBugs.values()) {
    const body = (issue.body || "") + " " + issue.title;
    // Simple heuristic: find file-like patterns
    const fileMatches = body.match(/[\w\-./]+\.(ts|js|py|tsx|jsx|java|go|rb|rs|cpp|c|h)/g);
    if (fileMatches) {
      for (const match of fileMatches) {
        bugsByFile.set(match, (bugsByFile.get(match) || 0) + 1);
      }
    }
  }

  const totalBugs = allBugs.size;
  logger.step("GitHub", `Found ${totalBugs} bug-related issues`);

  return { bugsByFile, totalBugs };
}

/**
 * Fetch repo contributors.
 */
export async function fetchContributors(
  owner: string,
  repo: string
): Promise<{
  contributors: GHContributor[];
  totalContributors: number;
}> {
  logger.step("GitHub", `Fetching contributors for ${owner}/${repo}`);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/contributors`;
  const contributors = await fetchPaginated<GHContributor>(url, 1);

  logger.step("GitHub", `Found ${contributors.length} contributors`);

  return {
    contributors,
    totalContributors: contributors.length,
  };
}

/**
 * Fetch repo file tree to detect test presence.
 */
export async function fetchRepoContents(
  owner: string,
  repo: string
): Promise<{
  files: { path: string; size: number }[];
  testPaths: Set<string>;
}> {
  logger.step("GitHub", `Fetching file tree for ${owner}/${repo}`);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
  const res = await fetchWithRetry(url);

  if (!res) {
    return { files: [], testPaths: new Set() };
  }

  const data = (await res.json()) as { tree: GHContent[] };
  const allFiles = (data.tree || []).filter((item) => item.type === "blob");
  const files = allFiles.map((item) => ({ path: item.path, size: item.size || 0 }));
  const pathsOnly = allFiles.map((item) => item.path);

  // Detect test files and test directories
  const testPatterns = [
    /test[s]?\//i,
    /__tests__\//i,
    /\.test\./i,
    /\.spec\./i,
    /_test\./i,
  ];

  const testPaths = new Set<string>();
  for (const file of pathsOnly) {
    for (const pattern of testPatterns) {
      if (pattern.test(file)) {
        testPaths.add(file);
        break;
      }
    }
  }

  logger.step("GitHub", `Found ${files.length} files, ${testPaths.size} test files`);

  return { files, testPaths };
}

// ---- Healer Agent: File Content + PR Creation ----

/**
 * Fetch the raw content of a single file from GitHub.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string
): Promise<{ content: string; sha: string } | null> {
  logger.step("GitHub", `Fetching file content: ${filePath}`);
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;
  const res = await fetchWithRetry(url);
  if (!res) return null;

  const data = (await res.json()) as { content?: string; sha?: string };
  if (!data.content || !data.sha) {
    logger.warn("GitHub", `No content returned for ${filePath}`);
    return null;
  }

  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: decoded, sha: data.sha };
}

/**
 * Create a new branch, commit patched file, and open a Pull Request.
 * Throws on failure with the actual GitHub API error message.
 */
export async function createBranchAndPR(
  owner: string,
  repo: string,
  filePath: string,
  patchedContent: string,
  fileSha: string,
  bugType: string
): Promise<{ prUrl: string; branchName: string }> {
  const token = process.env.github_fine_grained;
  if (!token) {
    throw new Error("No GitHub token configured. Set github_fine_grained in .env");
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "CEOfriend-Platform",
  };

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFile = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || "file";
  const safeBug = bugType.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const branchName = `ai-fix/${safeFile}-${safeBug}-${timestamp}`;

  // 1. Get default branch
  logger.step("GitHub", "Getting default branch ref...");
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: authHeaders });
  if (!repoRes.ok) {
    const body = await repoRes.text();
    throw new Error(`Repo info failed (${repoRes.status}): ${body}`);
  }
  const repoInfo = (await repoRes.json()) as { default_branch: string };
  const defaultBranch = repoInfo.default_branch;

  // 2. Get HEAD SHA
  const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, { headers: authHeaders });
  if (!refRes.ok) {
    const body = await refRes.text();
    throw new Error(`Get ref failed (${refRes.status}): ${body}`);
  }
  const refData = (await refRes.json()) as { object: { sha: string } };
  const baseSha = refData.object.sha;

  // 3. Create branch
  logger.step("GitHub", `Creating branch: ${branchName}`);
  const branchRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  });
  if (!branchRes.ok) {
    const body = await branchRes.text();
    throw new Error(`Create branch failed (${branchRes.status}): ${body}`);
  }

  // 4. Commit patched file
  logger.step("GitHub", "Committing patched file...");
  const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      message: `fix: ${bugType} in ${filePath}\n\nDetected and fixed by CEOfriend AI Repo Healer.`,
      content: Buffer.from(patchedContent, "utf-8").toString("base64"),
      sha: fileSha,
      branch: branchName,
    }),
  });
  if (!commitRes.ok) {
    const body = await commitRes.text();
    throw new Error(`Commit failed (${commitRes.status}): ${body}`);
  }

  // 5. Open PR
  logger.step("GitHub", "Opening Pull Request...");
  const prRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: `Fix: ${bugType} in ${filePath}`,
      head: branchName,
      base: defaultBranch,
      body: `## AI Repo Healer\n\n- **Detected by:** CEOfriend AI Repo Healer\n- **Issue:** ${bugType}\n- **Fix:** Minimal safe patch applied\n- **File:** ${filePath}\n\n> No structural changes were made.`,
    }),
  });
  if (!prRes.ok) {
    const body = await prRes.text();
    throw new Error(`Create PR failed (${prRes.status}): ${body}`);
  }

  const prData = (await prRes.json()) as { html_url: string };
  logger.step("GitHub", `PR created: ${prData.html_url}`);
  return { prUrl: prData.html_url, branchName };
}
