// ============================================================
// CEOfriend — Report Agent Tests
// Tests report structure and fallback behavior
// ============================================================

import { reportAgent } from "@/modules/reportAgent";
import type { ImpactData } from "@/lib/types";

// Mock the LLM service to avoid actual API calls in tests
jest.mock("@/services/llmService", () => ({
  generateReport: jest.fn().mockResolvedValue({
    summary: "Test executive summary.",
    keyRisks: [
      { component: "payment.ts", riskLevel: "Critical", businessImpact: "Revenue loss", expectedLoss: 420000 },
    ],
    financialImpact: "Total exposure: ₹5,00,000",
    costOfInaction: "Inaction leads to losses.",
    recommendations: ["Fix payment module", "Add tests"],
    generatedAt: new Date().toISOString(),
    confidence: "high",
  }),
}));

describe("Report Generation Agent", () => {
  const mockImpactData: ImpactData = {
    files: [
      {
        file: "payment.ts",
        businessFunction: "Revenue Generation",
        impactPerHour: 200000,
        expectedDowntime: 3,
        expectedLoss: 420000,
        userImpact: "Transaction failures",
        priority: 1,
        failureProbability: 0.7,
        predictedRisk: 90,
        reasons: ["Critical function", "High risk"],
      },
      {
        file: "auth.ts",
        businessFunction: "User Access",
        impactPerHour: 50000,
        expectedDowntime: 2,
        expectedLoss: 40000,
        userImpact: "Login failures",
        priority: 2,
        failureProbability: 0.4,
        predictedRisk: 60,
        reasons: ["Important function"],
      },
    ],
    totalRiskExposure: 460000,
  };

  it("should generate a report with all required sections", async () => {
    const report = await reportAgent(mockImpactData, 65);

    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);
    expect(report.keyRisks).toBeDefined();
    expect(report.keyRisks.length).toBeGreaterThan(0);
    expect(report.financialImpact).toBeDefined();
    expect(report.costOfInaction).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeDefined();
    expect(report.confidence).toBeDefined();
  });

  it("should return valid key risk objects", async () => {
    const report = await reportAgent(mockImpactData, 65);

    for (const risk of report.keyRisks) {
      expect(risk.component).toBeDefined();
      expect(risk.riskLevel).toBeDefined();
      expect(risk.businessImpact).toBeDefined();
      expect(typeof risk.expectedLoss).toBe("number");
    }
  });

  it("should handle LLM failure gracefully", async () => {
    // Override the mock to throw
    const llmService = require("@/services/llmService");
    llmService.generateReport.mockRejectedValueOnce(new Error("LLM API down"));

    const report = await reportAgent(mockImpactData, 50);

    // Should still return a valid report (fallback)
    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
