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
function calcVolatility(recentCommits: number, totalCommits: number): number {
  const safeCommits = Math.max(1, totalCommits);
  return clamp(Math.round((recentCommits / safeCommits) * 100), 0, 100);
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
    volatility: calcVolatility(file.recentCommits, file.commits),
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
  let importance = 1;
  const lowerFile = file.file.toLowerCase();

  // Business logic priority
  if (lowerFile.includes("payment")) importance = 1.5;
  else if (lowerFile.includes("auth") || lowerFile.includes("security")) importance = 1.2;
  
  // Extension & File Type differentiation for baseline variance
  else if (lowerFile.endsWith(".sol")) importance = 1.3; // Smart contracts are inherently riskier natively
  else if (lowerFile.endsWith(".jsx") || lowerFile.endsWith(".tsx")) importance = 1.1;
  else if (lowerFile.endsWith(".js") || lowerFile.endsWith(".ts") || lowerFile.endsWith(".py")) importance = 1.05;
  
  // Configs are less risky structurally
  else if (lowerFile.includes("config") || lowerFile.endsWith(".json") || lowerFile.endsWith(".gitignore") || lowerFile.endsWith(".md")) importance = 0.8;

  let riskScore = baseRisk * importance;
  // FIX 3: Saturation Curve to avoid maxing out rapidly
  riskScore = 100 * (1 - Math.exp(-riskScore / 50));
  riskScore = Math.round(riskScore);

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

  let avgHealth = safeDivide(weightedHealth, totalWeight, 50);
  let avgRisk = 100 - avgHealth;

  // FIX 4: Size Normalization
  const totalRepoFiles = repoData.summary.totalFiles || 1;
  const repoSizeFactor = Math.log10(totalRepoFiles + 1);
  avgRisk = avgRisk / Math.max(1, repoSizeFactor);

  // FIX 5: Outliers 
  if (totalRepoFiles < 10) {
    avgRisk *= 0.7; // Small repos get 30% reduction to offset single file variance
  }

  return clamp(100 - Math.round(avgRisk), 0, 100);
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
