// ============================================================
// CEOfriend — Repo Analysis Agent
// Entry point of the pipeline. Extracts engineering signals
// from a GitHub repository and produces structured RepoData.
// ============================================================

import type { RepoData, RepoFile } from "@/lib/types";
import { parseRepoUrl, logger } from "@/lib/utils";
import {
  fetchIssues,
  fetchContributors,
  fetchRepoContents,
  fetchFileStats,
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
  bugsByFile: Map<string, number>,
  allFiles: { path: string; size: number }[],
  maxFiles: number = 20
): string[] {
  const scored = new Map<string, number>();

  // Score by bugs (Heavy weight)
  for (const [file, count] of bugsByFile) {
    if (shouldIgnoreFile(file)) continue;
    scored.set(file, (scored.get(file) || 0) + count * 5);
  }

  // Score by critical paths and file tree
  for (const fileObj of allFiles) {
    const file = fileObj.path;
    if (shouldIgnoreFile(file)) continue;
    
    // Baseline score so non-bug files still have a chance
    let score = scored.get(file) || 1; 

    // FIX 5: Better hotspot ranking
    if (file.toLowerCase().includes("payment")) {
      score += 50;
    } else if (file.toLowerCase().includes("auth")) {
      score += 30;
    } else if (isCriticalPath(file)) {
      score += 10;
    }
    
    scored.set(file, score);
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

  // Fetch global data in parallel
  const [issueResult, contributorResult, contentResult] =
    await Promise.all([
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
        return { files: [] as { path: string; size: number }[], testPaths: new Set<string>() };
      }),
    ]);

  if (contentResult.files.length === 0) {
    throw new Error("GitHub API Rate Limit exceeded or repository is empty. Please configure 'github_fine_grained' in your .env.local token to analyze more repositories.");
  }

  // Select hotspot files (prioritizing bugs and critical paths)
  const hotspots = selectHotspots(
    issueResult.bugsByFile,
    contentResult.files
  );

  // For each hotspot, explicitly fetch its real file stats to avoid dropping files with low global commit counts
  logger.step("RepoAgent", `Fetching file-specific stats for ${hotspots.length} hotspots`);
  
  const hotspotStatsPromises = hotspots.map(async (filename) => {
    const stats = await fetchFileStats(owner, repo, filename);
    const bugs = issueResult.bugsByFile.get(filename) || 0;
    const hasTests = hasTestsForFile(filename, contentResult.testPaths);
    const fileObj = contentResult.files.find(f => f.path === filename);
    
    return {
      file: filename,
      commits: Math.max(1, stats.commits),         // Minimum 1 commit to protect math
      recentCommits: stats.recentCommits,
      bugs,
      contributors: stats.contributors,            // Actual file-level contributors
      hasTests,
      size: fileObj?.size || 0,
    };
  });

  const files: RepoFile[] = await Promise.all(hotspotStatsPromises);

  // If no hotspots were found, fetch some default ones from the tree (Edge case)
  if (files.length === 0 && contentResult.files.length > 0) {
    logger.warn("RepoAgent", "No hotspots detected. Creating fallback entries from file tree.");
    const codeFiles = contentResult.files
      .filter((f) => !shouldIgnoreFile(f.path))
      .slice(0, 10);
      
    for (const fileObj of codeFiles) {
      const filename = fileObj.path;
      files.push({
        file: filename,
        commits: 1,
        recentCommits: 0,
        bugs: 0,
        contributors: 1,
        hasTests: hasTestsForFile(filename, contentResult.testPaths),
        size: fileObj.size,
      });
    }
  }

  const result: RepoData = {
    repo,
    owner,
    files,
    summary: {
      totalCommits: 0, // Deprecated at global level, keeping for type compliance
      totalBugs: issueResult.totalBugs,
      totalContributors: contributorResult.totalContributors,
      analyzedFiles: files.length,
    },
  };

  logger.step("RepoAgent", `Analysis complete. ${files.length} files analyzed.`);
  return result;
}
