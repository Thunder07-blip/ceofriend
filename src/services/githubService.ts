// ============================================================
// CEOfriend — GitHub Service
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
    author: { date: string };
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
}

// ---- Public API ----

/**
 * Fetch recent commits with file-level detail.
 * Limits to last 30 days worth of commits.
 */
export async function fetchCommits(
  owner: string,
  repo: string
): Promise<{
  commitsByFile: Map<string, number>;
  recentCommitsByFile: Map<string, number>;
  totalCommits: number;
}> {
  logger.step("GitHub", `Fetching commits for ${owner}/${repo}`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits?since=${sixtyDaysAgo.toISOString()}`;
  const commits = await fetchPaginated<GHCommit>(url, 3);

  const commitsByFile = new Map<string, number>();
  const recentCommitsByFile = new Map<string, number>();

  // For detailed file info, fetch individual commits (limit to first 30)
  const detailedCommits = commits.slice(0, 30);

  for (const commit of detailedCommits) {
    const detailRes = await fetchWithRetry(
      `${GITHUB_API}/repos/${owner}/${repo}/commits/${commit.sha}`
    );

    if (!detailRes) continue;

    const detail = (await detailRes.json()) as GHCommit;
    const commitDate = new Date(detail.commit.author.date);
    const isRecent = commitDate >= thirtyDaysAgo;

    if (detail.files) {
      for (const file of detail.files) {
        const name = file.filename;
        commitsByFile.set(name, (commitsByFile.get(name) || 0) + 1);
        if (isRecent) {
          recentCommitsByFile.set(name, (recentCommitsByFile.get(name) || 0) + 1);
        }
      }
    }
  }

  logger.step("GitHub", `Found ${commits.length} commits, ${commitsByFile.size} unique files`);

  return {
    commitsByFile,
    recentCommitsByFile,
    totalCommits: commits.length,
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
  files: string[];
  testPaths: Set<string>;
}> {
  logger.step("GitHub", `Fetching file tree for ${owner}/${repo}`);

  const url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
  const res = await fetchWithRetry(url);

  if (!res) {
    return { files: [], testPaths: new Set() };
  }

  const data = (await res.json()) as { tree: GHContent[] };
  const files = (data.tree || [])
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  // Detect test files and test directories
  const testPatterns = [
    /test[s]?\//i,
    /__tests__\//i,
    /\.test\./i,
    /\.spec\./i,
    /_test\./i,
  ];

  const testPaths = new Set<string>();
  for (const file of files) {
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
