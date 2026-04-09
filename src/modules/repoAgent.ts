// ============================================================
// CEOfriend — Repo Analysis Agent
// Entry point of the pipeline. Extracts engineering signals
// from a GitHub repository and produces structured RepoData.
// ============================================================

import type { RepoData, RepoFile } from "@/lib/types";
import { parseRepoUrl, logger } from "@/lib/utils";
import {
  fetchCommits,
  fetchIssues,
  fetchContributors,
  fetchRepoContents,
} from "@/services/githubService";

// Critical directories that always get included in analysis
const CRITICAL_PATHS = [
  "payment",
  "billing",
  "checkout",
  "auth",
  "login",
  "signup",
  "core",
  "api",
  "database",
  "db",
  "order",
  "transaction",
  "user",
  "security",
];

// Files to always ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.env/,
  /package-lock/,
  /yarn\.lock/,
  /\.md$/,
  /\.txt$/,
  /\.json$/,
  /\.yml$/,
  /\.yaml$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.ico$/,
  /\.css$/,
  /\.scss$/,
  /\.less$/,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
];

function shouldIgnoreFile(filename: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(filename));
}

function isCriticalPath(filename: string): boolean {
  const lower = filename.toLowerCase();
  return CRITICAL_PATHS.some((path) => lower.includes(path));
}

/**
 * Detect if a file has associated test files.
 */
function hasTestsForFile(filename: string, testPaths: Set<string>): boolean {
  const baseName = filename.replace(/\.[^.]+$/, "");
  const testVariants = [
    `${baseName}.test.`,
    `${baseName}.spec.`,
    `${baseName}_test.`,
    `test/${baseName}`,
    `tests/${baseName}`,
    `__tests__/${baseName}`,
  ];

  for (const testPath of testPaths) {
    for (const variant of testVariants) {
      if (testPath.includes(variant)) return true;
    }
  }

  return false;
}

/**
 * Select hotspot files — the most important files to analyze.
 * Strategy: top 20 by commits + bug-heavy + critical paths
 */
function selectHotspots(
  commitsByFile: Map<string, number>,
  bugsByFile: Map<string, number>,
  allFiles: string[],
  maxFiles: number = 20
): string[] {
  const scored = new Map<string, number>();

  // Score by commits
  for (const [file, count] of commitsByFile) {
    if (shouldIgnoreFile(file)) continue;
    scored.set(file, (scored.get(file) || 0) + count * 2);
  }

  // Score by bugs
  for (const [file, count] of bugsByFile) {
    if (shouldIgnoreFile(file)) continue;
    scored.set(file, (scored.get(file) || 0) + count * 5);
  }

  // Boost critical paths
  for (const file of allFiles) {
    if (shouldIgnoreFile(file)) continue;
    if (isCriticalPath(file)) {
      scored.set(file, (scored.get(file) || 0) + 10);
    }
  }

  // Sort by score and take top N
  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFiles)
    .map(([file]) => file);
}

// ---- Public API ----

/**
 * Analyze a repository and return structured data.
 * Gracefully handles API failures by returning partial data.
 */
export async function repoAgent(repoUrl: string): Promise<RepoData> {
  logger.step("RepoAgent", `Starting analysis for: ${repoUrl}`);

  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error(`Invalid repository URL: ${repoUrl}`);
  }

  const { owner, repo } = parsed;

  // Fetch all data in parallel for speed
  const [commitResult, issueResult, contributorResult, contentResult] =
    await Promise.all([
      fetchCommits(owner, repo).catch((err) => {
        logger.error("RepoAgent", "Failed to fetch commits", err);
        return {
          commitsByFile: new Map<string, number>(),
          recentCommitsByFile: new Map<string, number>(),
          totalCommits: 0,
        };
      }),
      fetchIssues(owner, repo).catch((err) => {
        logger.error("RepoAgent", "Failed to fetch issues", err);
        return { bugsByFile: new Map<string, number>(), totalBugs: 0 };
      }),
      fetchContributors(owner, repo).catch((err) => {
        logger.error("RepoAgent", "Failed to fetch contributors", err);
        return { contributors: [], totalContributors: 0 };
      }),
      fetchRepoContents(owner, repo).catch((err) => {
        logger.error("RepoAgent", "Failed to fetch contents", err);
        return { files: [] as string[], testPaths: new Set<string>() };
      }),
    ]);

  // Select hotspot files
  const hotspots = selectHotspots(
    commitResult.commitsByFile,
    issueResult.bugsByFile,
    contentResult.files
  );

  // Build file data for each hotspot
  const files: RepoFile[] = hotspots.map((filename) => {
    const commits = commitResult.commitsByFile.get(filename) || 0;
    const recentCommits = commitResult.recentCommitsByFile.get(filename) || 0;
    const bugs = issueResult.bugsByFile.get(filename) || 0;

    // Estimate contributors per file (approximate from global data)
    const totalContribs = contributorResult.totalContributors;
    const fileWeight = commits / Math.max(1, commitResult.totalCommits);
    const fileContributors = Math.max(1, Math.round(totalContribs * fileWeight));

    const hasTests = hasTestsForFile(filename, contentResult.testPaths);

    return {
      file: filename,
      commits,
      recentCommits,
      bugs,
      contributors: fileContributors,
      hasTests,
    };
  });

  // If no hotspots were found, create synthetic entries from file tree
  if (files.length === 0 && contentResult.files.length > 0) {
    logger.warn("RepoAgent", "No hotspots detected. Creating entries from file tree.");
    const codeFiles = contentResult.files
      .filter((f) => !shouldIgnoreFile(f))
      .slice(0, 10);

    for (const f of codeFiles) {
      files.push({
        file: f,
        commits: 1,
        recentCommits: 0,
        bugs: 0,
        contributors: 1,
        hasTests: hasTestsForFile(f, contentResult.testPaths),
      });
    }
  }

  const result: RepoData = {
    repo,
    owner,
    files,
    summary: {
      totalCommits: commitResult.totalCommits,
      totalBugs: issueResult.totalBugs,
      totalContributors: contributorResult.totalContributors,
      analyzedFiles: files.length,
    },
  };

  logger.step("RepoAgent", `Analysis complete. ${files.length} files analyzed.`);
  return result;
}
