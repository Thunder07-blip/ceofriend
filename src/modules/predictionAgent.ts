// ============================================================
// CEOfriend — Prediction Agent
// Forecasts future risk using trend-based heuristics.
// NO ML, NO LLM — pure deterministic math.
// ============================================================

import type { RiskData, PredictionData, FilePrediction, RiskTrend } from "@/lib/types";
import { clamp, safeDivide, logger } from "@/lib/utils";

/**
 * Determine risk trend label from growth factor.
 */
function getTrend(growthFactor: number): RiskTrend {
  if (growthFactor > 1.2) return "increasing";
  if (growthFactor < 0.9) return "decreasing";
  return "stable";
}

/**
 * Generate prediction reasons based on signals.
 */
function generateReasons(
  riskScore: number,
  commitTrend: number,
  bugTrend: number,
  growthFactor: number
): string[] {
  const reasons: string[] = [];

  if (riskScore >= 70) reasons.push("High current risk score");
  else if (riskScore >= 40) reasons.push("Moderate current risk");

  if (commitTrend > 0.4) reasons.push("Rapidly increasing commit activity");
  else if (commitTrend > 0.25) reasons.push("Increasing code change frequency");

  if (bugTrend > 0.15) reasons.push("Rising bug frequency relative to changes");
  else if (bugTrend > 0.05) reasons.push("Moderate bug-to-commit ratio");

  if (growthFactor > 1.3) reasons.push("Strong upward risk trend detected");

  if (reasons.length === 0) reasons.push("Component shows stable risk profile");

  return reasons;
}

/**
 * Predict risk for a single file.
 */
export function predictFile(file: {
  file: string;
  riskScore: number;
  commits: number;
  recentCommits: number;
  bugs: number;
}): FilePrediction {
  // Step 1: Analyze trends
  const commitTrend = safeDivide(file.recentCommits, file.commits, 0);
  const bugTrend = safeDivide(file.bugs, file.commits, 0);

  // Step 2: Calculate growth factor
  const growthFactor = 1 + commitTrend * 0.5 + bugTrend * 0.5;

  // Step 3: Project future risk
  const predictedRisk = clamp(Math.round(file.riskScore * growthFactor), 0, 100);

  // Step 4: Failure probability
  const failureProbability = Number((predictedRisk / 100).toFixed(2));

  // Step 5: Confidence score (more data = higher confidence)
  const confidence = clamp(
    Number(
      (
        safeDivide(file.commits, 100, 0) * 0.5 +
        safeDivide(file.bugs, 20, 0) * 0.5
      ).toFixed(2)
    ),
    0,
    1
  );

  // Step 6: Trend label
  const riskTrend = getTrend(growthFactor);

  // Step 7: Generate reasons
  const reasons = generateReasons(file.riskScore, commitTrend, bugTrend, growthFactor);

  return {
    file: file.file,
    predictedRisk,
    failureProbability,
    riskTrend,
    confidence,
    reasons,
    riskScore: file.riskScore,
    recentCommits: file.recentCommits,
    commits: file.commits,
    bugs: file.bugs,
  };
}

// ---- Public API ----

/**
 * Prediction Agent: forecast future risks for all analyzed files.
 * Pure function — no external calls, fully deterministic.
 */
export function predictionAgent(riskData: RiskData): PredictionData {
  logger.step("PredictionAgent", `Predicting risks for ${riskData.files.length} files`);

  // We need the original repo data merged with risk scores.
  // Risk data files carry riskScore. We'll use defaults for missing commit data.
  const files: FilePrediction[] = riskData.files.map((fileRisk) => {
    return predictFile({
      file: fileRisk.file,
      riskScore: fileRisk.riskScore,
      // These will be populated by the orchestrator passing enriched data
      commits: 1,
      recentCommits: 0,
      bugs: 0,
    });
  });

  // Sort by predicted risk (highest first)
  files.sort((a, b) => b.predictedRisk - a.predictedRisk);

  logger.step("PredictionAgent", `Prediction complete.`);
  return { files };
}

/**
 * Enhanced prediction agent that uses original repo data for accurate trends.
 */
export function predictionAgentEnriched(
  riskData: RiskData,
  repoFiles: { file: string; commits: number; recentCommits: number; bugs: number }[]
): PredictionData {
  logger.step("PredictionAgent", `Predicting risks for ${riskData.files.length} files (enriched)`);

  const repoMap = new Map(repoFiles.map((f) => [f.file, f]));

  const files: FilePrediction[] = riskData.files.map((fileRisk) => {
    const repoFile = repoMap.get(fileRisk.file);
    return predictFile({
      file: fileRisk.file,
      riskScore: fileRisk.riskScore,
      commits: repoFile?.commits || 1,
      recentCommits: repoFile?.recentCommits || 0,
      bugs: repoFile?.bugs || 0,
    });
  });

  files.sort((a, b) => b.predictedRisk - a.predictedRisk);

  logger.step("PredictionAgent", `Prediction complete.`);
  return { files };
}
