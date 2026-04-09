// ============================================================
// CEOfriend — Report Generation Agent
// Converts analysis into CEO-friendly reports.
// Uses LLM for natural language, with deterministic fallback.
// Now enhanced with CEO-provided company context.
// ============================================================

import type { ImpactData, Report, CompanyContext } from "@/lib/types";
import { generateReport as llmGenerateReport } from "@/services/llmService";
import { logger } from "@/lib/utils";

// ---- Public API ----

/**
 * Report Agent: generate a CEO-friendly business report.
 * Uses LLM service with fallback to template-based generation.
 * Accepts optional CompanyContext for richer, personalized reports.
 */
export async function reportAgent(
  impactData: ImpactData,
  repoHealth: number,
  companyContext?: CompanyContext | null
): Promise<Report> {
  logger.step("ReportAgent", "Generating CEO report...");

  try {
    const report = await llmGenerateReport(impactData, repoHealth, companyContext);
    logger.step("ReportAgent", "Report generation complete.");
    return report;
  } catch (err) {
    logger.error("ReportAgent", "Report generation failed", err);

    // Build context-aware fallback
    const industryLabel = companyContext?.industry
      ? companyContext.industry.charAt(0).toUpperCase() + companyContext.industry.slice(1)
      : "Technology";
    const companyDesc = companyContext?.description
      ? ` The company operates in the ${industryLabel} space: "${companyContext.description.slice(0, 100)}".`
      : "";

    // Ultimate fallback — return a minimal report
    return {
      summary: `System health score: ${repoHealth}/100. Total financial risk exposure: ₹${impactData.totalRiskExposure.toLocaleString("en-IN")}.${companyDesc} Analysis identified ${impactData.files.length} components requiring attention.`,
      keyRisks: impactData.files.slice(0, 3).map((f) => ({
        component: f.file,
        riskLevel: f.predictedRisk >= 80 ? "Critical" : f.predictedRisk >= 60 ? "High" : "Medium",
        businessImpact: f.userImpact,
        expectedLoss: f.expectedLoss,
      })),
      financialImpact: `Total projected financial exposure: ₹${impactData.totalRiskExposure.toLocaleString("en-IN")}${companyContext?.yearlyTurnover ? ` (${((impactData.totalRiskExposure / companyContext.yearlyTurnover) * 100).toFixed(1)}% of annual turnover)` : ""}`,
      costOfInaction: "Delaying action on identified risks may lead to increased financial exposure and system instability over the next 90 days.",
      recommendations: [
        "Address the highest-risk components immediately",
        "Improve test coverage in critical modules",
        "Establish monitoring for high-change-frequency areas",
      ],
      generatedAt: new Date().toISOString(),
      confidence: "low",
    };
  }
}
