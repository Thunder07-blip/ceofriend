// ============================================================
// CEOfriend — Risk Scoring Agent
// Deterministic, explainable risk scoring. NO ML, NO LLM.
// 4 dimensions: volatility, bugDensity, ownership, testCoverage
// ============================================================

import type { RepoData, RiskData, FileRisk, RiskBreakdown } from "@/lib/types";
import { clamp, safeDivide, logger } from "@/lib/utils";

const WEIGHTS = {
  volatility: 0.25,
  bugDensity: 0.35,
  ownership: 0.1,
  testCoverage: 0.15,
  uncertainty: 0.15,
};

/**
 * Calculate volatility score (0-100).
 * FIX 2: Add Volatility Floor to prevent zero collapse
 */
function calcVolatility(recentCommits: number): number {
  return clamp(Math.max(10, recentCommits * 2), 0, 100);
}

/**
 * Calculate bug density score (0-100).
 * FIX 3: Fix Bug Density to treat 0-bugs as uncertain baseline.
 */
function calcBugDensity(bugs: number, commits: number): number {
  const safeCommits = Math.max(1, commits);
  return bugs === 0 
    ? 10 
    : clamp(Math.round((bugs / safeCommits) * 100), 0, 100);
}

/**
 * Calculate ownership risk score (0-100).
 * Fewer contributors = higher bus factor risk.
 */
function calcOwnership(contributors: number): number {
  if (contributors <= 1) return 100;
  if (contributors <= 3) return 60;
  if (contributors <= 5) return 30;
  return 20;
}

/**
 * Calculate test coverage risk score (0-100).
 * No tests = very high risk.
 */
function calcTestCoverage(hasTests: boolean): number {
  return hasTests ? 20 : 100;
}

/**
 * Calculate uncertainty risk (0-100).
 * FIX 1: Absence of signal implies uncertainty, raising risk floors.
 */
function calculateUncertainty(file: { commits: number; recentCommits: number; bugs: number }): number {
  let uncertainty = 0;
  if (file.commits === 0) uncertainty += 30;
  if (file.recentCommits === 0) uncertainty += 20;
  if (file.bugs === 0) uncertainty += 10;
  return clamp(uncertainty, 0, 100);
}

/**
 * Generate human-readable reasons for a risk score.
 */
function generateReasons(breakdown: RiskBreakdown, hasTests: boolean, recentCommits: number, bugs: number, uncertainty: number): string[] {
  const reasons: string[] = [];

  if (uncertainty >= 30) {
    reasons.push("High unmeasured uncertainty (low tracked data)");
  }

  if (breakdown.volatility >= 60) {
    reasons.push(`High change activity (${recentCommits} recent commits)`);
  } else if (breakdown.volatility >= 30) {
    reasons.push("Moderate code change frequency");
  }

  if (breakdown.bugDensity >= 50) {
    reasons.push(`Frequent bug reports (${bugs} bugs detected)`);
  } else if (breakdown.bugDensity >= 20) {
    reasons.push("Some bug-related issues found");
  }

  if (breakdown.ownership >= 80) {
    reasons.push("Single contributor — high bus factor risk");
  } else if (breakdown.ownership >= 50) {
    reasons.push("Limited contributor base");
  }

  if (!hasTests) {
    reasons.push("No test coverage detected");
  }

  if (reasons.length === 0) {
    reasons.push("Component appears stable");
  }

  return reasons;
}

/**
 * Calculate risk for a single file.
 */
export function calculateFileRisk(file: {
  file: string;
  commits: number;
  recentCommits: number;
  bugs: number;
  contributors: number;
  hasTests: boolean;
  size?: number;
}): FileRisk {
  const breakdown: RiskBreakdown = {
    volatility: calcVolatility(file.recentCommits),
    bugDensity: calcBugDensity(file.bugs, file.commits),
    ownership: calcOwnership(file.contributors),
    testCoverage: calcTestCoverage(file.hasTests),
    uncertainty: calculateUncertainty(file),
  };

  const baseRisk = 
    breakdown.volatility * WEIGHTS.volatility +
    breakdown.bugDensity * WEIGHTS.bugDensity +
    breakdown.ownership * WEIGHTS.ownership +
    breakdown.testCoverage * WEIGHTS.testCoverage +
    breakdown.uncertainty * WEIGHTS.uncertainty;

  // FIX 4: Add File Differentiation
  const importance = file.file.toLowerCase().includes("payment") ? 1.5 
    : file.file.toLowerCase().includes("auth") ? 1.2 
    : 1;

  const riskScore = Math.round(baseRisk * importance);

  const healthScore = clamp(100 - riskScore, 0, 100);
  const reasons = generateReasons(breakdown, file.hasTests, file.recentCommits, file.bugs, breakdown.uncertainty);

  // FIX 3: Debug test output as requested by user
  console.log({
    file: file.file,
    commits: file.commits,
    recentCommits: file.recentCommits,
    bugs: file.bugs,
    volatility: breakdown.volatility,
    bugDensity: breakdown.bugDensity,
    ownership: breakdown.ownership,
    test: breakdown.testCoverage,
    uncertainty: breakdown.uncertainty,
    finalRisk: clamp(riskScore, 0, 100)
  });

  return {
    file: file.file,
    riskScore: clamp(riskScore, 0, 100),
    healthScore,
    breakdown,
    reasons,
  };
}

/**
 * Calculate repo-level health as a weighted average of file health scores.
 * Files with more commits get more weight (they're more important).
 */
function calculateRepoHealth(fileRisks: FileRisk[], repoData: RepoData): number {
  if (fileRisks.length === 0) return 100;

  let totalWeight = 0;
  let weightedHealth = 0;

  for (const risk of fileRisks) {
    const fileData = repoData.files.find((f) => f.file === risk.file);
    const weight = Math.max(1, fileData?.commits || 1);
    totalWeight += weight;
    weightedHealth += risk.healthScore * weight;
  }

  return Math.round(safeDivide(weightedHealth, totalWeight, 50));
}

// ---- Public API ----

/**
 * Risk Agent: score all files and compute overall repo health.
 * Pure function — no external calls, fully deterministic.
 */
export function riskAgent(repoData: RepoData): RiskData {
  logger.step("RiskAgent", `Scoring ${repoData.files.length} files`);

  const files: FileRisk[] = repoData.files.map((file) => calculateFileRisk(file));

  // Sort by risk score (highest first)
  files.sort((a, b) => b.riskScore - a.riskScore);

  const repoHealth = calculateRepoHealth(files, repoData);

  logger.step("RiskAgent", `Scoring complete. Repo health: ${repoHealth}/100`);

  return { files, repoHealth };
}
