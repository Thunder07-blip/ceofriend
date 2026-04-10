// ============================================================
// CEOfriend — Orchestrator
// Central controller: coordinates all agents in a linear pipeline.
// Handles errors gracefully with partial results.
// ============================================================

import type { PipelineResult, PipelineError, RepoData, RiskData, PredictionData, ImpactData, Report, CompanyContext } from "@/lib/types";
import { logger } from "@/lib/utils";
import { cache } from "@/services/cacheService";
import { repoAgent } from "@/modules/repoAgent";
import { riskAgent } from "@/modules/riskAgent";
import { predictionAgentEnriched } from "@/modules/predictionAgent";
import { impactAgent } from "@/modules/impactAgent";
import { reportAgent } from "@/modules/reportAgent";
import fs from "fs";
import path from "path";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Append the final pipeline result to a persistent CSV log.
 */
function appendScoringLog(repoUrl: string, result: PipelineResult) {
  try {
    const logFilePath = path.join(process.cwd(), "scoring-logs.csv");
    const isNewFile = !fs.existsSync(logFilePath);

    // CSV Headers
    if (isNewFile) {
      fs.writeFileSync(
        logFilePath,
        "Timestamp,Repository,File Name,Risk Score,Failure Probability,Expected Loss (INR)\n"
      );
    }

    const timestamp = result.analyzedAt;
    const repo = repoUrl;

    if (result.impactData?.files) {
      let csvData = "";
      for (const fileImpact of result.impactData.files) {
        const fileName = fileImpact.file;
        const riskScore = fileImpact.predictedRisk;
        const failProb = (fileImpact.failureProbability * 100).toFixed(2) + "%";
        const expectedLoss = fileImpact.expectedLoss;

        csvData += `"${timestamp}","${repo}","${fileName}","${riskScore}","${failProb}","${expectedLoss}"\n`;
      }
      if (csvData) {
        fs.appendFileSync(logFilePath, csvData);
        logger.step("Orchestrator", `Stored ${result.impactData.files.length} file components to ${logFilePath}`);
      }
    } else {
      // If no files could be scored (e.g. rate limit), just log a single error row
      const errorMsg = result.errors.map(e => e.message).join(" | ");
      fs.appendFileSync(logFilePath, `"${timestamp}","${repo}","[NO FILES]","N/A","N/A","ERROR: ${errorMsg}"\n`);
    }
  } catch (err) {
    logger.error("Orchestrator", "Failed to write scoring log CSV", err);
  }
}

/**
 * Run the full analysis pipeline.
 *
 * Pipeline: RepoAgent → RiskAgent → PredictionAgent → ImpactAgent → ReportAgent
 *
 * Error handling strategy:
 * - Each stage is wrapped in try-catch
 * - On failure: log error, record it, continue with available data
 * - Return partial results + error list
 */
export async function orchestrate(repoUrl: string, companyContext?: CompanyContext | null): Promise<PipelineResult> {
  const startTime = Date.now();
  logger.step("Orchestrator", `Pipeline started for: ${repoUrl}`);

  const errors: PipelineError[] = [];
  let repoData: RepoData | null = null;
  let riskData: RiskData | null = null;
  let predictionData: PredictionData | null = null;
  let impactData: ImpactData | null = null;
  let report: Report | null = null;

  // ---- Stage 1: Repo Analysis ----
  try {
    logger.step("Orchestrator", "Stage 1/5: Repo Analysis");

    // Check cache first
    const cacheKey = `repo:${repoUrl}`;
    const cached = cache.get<RepoData>(cacheKey);
    if (cached) {
      logger.step("Orchestrator", "Cache hit for repo data");
      repoData = cached;
    } else {
      repoData = await repoAgent(repoUrl);
      cache.set(cacheKey, repoData, CACHE_TTL);
    }

    logger.step("Orchestrator", `Stage 1 complete. ${repoData.files.length} files analyzed.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error in repo analysis";
    logger.error("Orchestrator", "Stage 1 FAILED", err);
    errors.push({ stage: "repo-analysis", message, code: "REPO_ANALYSIS_FAILED" });
  }

  // ---- Stage 2: Risk Scoring ----
  if (repoData) {
    try {
      logger.step("Orchestrator", "Stage 2/5: Risk Scoring");
      riskData = riskAgent(repoData);
      logger.step("Orchestrator", `Stage 2 complete. Repo health: ${riskData.repoHealth}/100`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error in risk scoring";
      logger.error("Orchestrator", "Stage 2 FAILED", err);
      errors.push({ stage: "risk-scoring", message, code: "RISK_SCORING_FAILED" });
    }
  }

  // ---- Stage 3: Prediction ----
  if (riskData && repoData) {
    try {
      logger.step("Orchestrator", "Stage 3/5: Prediction");
      predictionData = predictionAgentEnriched(riskData, repoData.files);
      logger.step("Orchestrator", "Stage 3 complete.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error in prediction";
      logger.error("Orchestrator", "Stage 3 FAILED", err);
      errors.push({ stage: "prediction", message, code: "PREDICTION_FAILED" });
    }
  }

  // ---- Stage 4: Business Impact ----
  if (predictionData) {
    try {
      logger.step("Orchestrator", "Stage 4/5: Business Impact");
      impactData = impactAgent(predictionData, companyContext);
      logger.step("Orchestrator", `Stage 4 complete. Total exposure: ₹${impactData.totalRiskExposure.toLocaleString("en-IN")}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error in impact analysis";
      logger.error("Orchestrator", "Stage 4 FAILED", err);
      errors.push({ stage: "business-impact", message, code: "IMPACT_FAILED" });
    }
  }

  // ---- Stage 5: Report Generation ----
  if (impactData && riskData) {
    try {
      logger.step("Orchestrator", "Stage 5/5: Report Generation");
      report = await reportAgent(impactData, riskData.repoHealth, companyContext);
      logger.step("Orchestrator", "Stage 5 complete.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error in report generation";
      logger.error("Orchestrator", "Stage 5 FAILED", err);
      errors.push({ stage: "report-generation", message, code: "REPORT_FAILED" });
    }
  }

  const elapsed = Date.now() - startTime;
  const success = errors.length === 0;

  logger.step(
    "Orchestrator",
    `Pipeline ${success ? "completed successfully" : "completed with errors"} in ${elapsed}ms. Errors: ${errors.length}`
  );

  const pipelineResult: PipelineResult = {
    success,
    repoData,
    riskData,
    predictionData,
    impactData,
    report,
    companyContext: companyContext || null,
    errors,
    analyzedAt: new Date().toISOString(),
  };

  // Natively log the entire execution scoring to CSV
  appendScoringLog(repoUrl, pipelineResult);

  return pipelineResult;
}
