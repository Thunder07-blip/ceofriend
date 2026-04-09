// ============================================================
// CEOfriend — Impact Agent Tests
// Tests business mapping, downtime estimation, loss calculation
// ============================================================

import { calculateFileImpact, getBusinessMapping, impactAgent } from "@/modules/impactAgent";
import type { PredictionData } from "@/lib/types";

describe("Business Impact Agent", () => {
  describe("getBusinessMapping", () => {
    it("should map payment files to Revenue Generation", () => {
      const mapping = getBusinessMapping("src/payment/processor.ts");
      expect(mapping.function).toBe("Revenue Generation");
      expect(mapping.type).toBe("critical");
      expect(mapping.impactPerHour).toBe(200000);
    });

    it("should map auth files to User Access", () => {
      const mapping = getBusinessMapping("auth/login.ts");
      expect(mapping.function).toBe("User Access");
      expect(mapping.type).toBe("high");
    });

    it("should use default mapping for unrecognized files", () => {
      const mapping = getBusinessMapping("utils/helpers.ts");
      expect(mapping.function).toBe("General Operations");
      expect(mapping.type).toBe("low");
      expect(mapping.impactPerHour).toBe(10000);
    });

    it("should be case-insensitive", () => {
      const mapping = getBusinessMapping("PAYMENT/Handler.ts");
      expect(mapping.function).toBe("Revenue Generation");
    });
  });

  describe("calculateFileImpact", () => {
    it("should calculate higher loss for high-risk payment file", () => {
      const result = calculateFileImpact({
        file: "payment.py",
        predictedRisk: 90,
        failureProbability: 0.7,
      });

      // 0.7 * 200000 * 3 = 420000
      expect(result.expectedLoss).toBeGreaterThan(300000);
      expect(result.expectedDowntime).toBe(3);
      expect(result.businessFunction).toBe("Revenue Generation");
    });

    it("should estimate correct downtime tiers", () => {
      const high = calculateFileImpact({ file: "a.ts", predictedRisk: 90, failureProbability: 0.5 });
      const mid = calculateFileImpact({ file: "b.ts", predictedRisk: 60, failureProbability: 0.5 });
      const low = calculateFileImpact({ file: "c.ts", predictedRisk: 30, failureProbability: 0.5 });

      expect(high.expectedDowntime).toBe(3);
      expect(mid.expectedDowntime).toBe(2);
      expect(low.expectedDowntime).toBe(1);
    });

    it("should handle zero failure probability", () => {
      const result = calculateFileImpact({
        file: "payment.ts",
        predictedRisk: 0,
        failureProbability: 0,
      });

      expect(result.expectedLoss).toBe(0);
    });

    it("should generate impact reasons", () => {
      const result = calculateFileImpact({
        file: "payment.ts",
        predictedRisk: 85,
        failureProbability: 0.8,
      });

      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe("impactAgent", () => {
    it("should process all prediction files and calculate total exposure", () => {
      const predictionData: PredictionData = {
        files: [
          { file: "payment.ts", predictedRisk: 90, failureProbability: 0.7, riskTrend: "increasing", confidence: 0.8, reasons: [], riskScore: 85, recentCommits: 40, commits: 100, bugs: 10 },
          { file: "auth.ts", predictedRisk: 60, failureProbability: 0.4, riskTrend: "stable", confidence: 0.6, reasons: [], riskScore: 55, recentCommits: 10, commits: 50, bugs: 3 },
        ],
      };

      const result = impactAgent(predictionData);

      expect(result.files).toHaveLength(2);
      expect(result.totalRiskExposure).toBeGreaterThan(0);
      // Should be sorted by expectedLoss (highest first)
      expect(result.files[0].expectedLoss).toBeGreaterThanOrEqual(result.files[1].expectedLoss);
      // Priority should be assigned
      expect(result.files[0].priority).toBe(1);
      expect(result.files[1].priority).toBe(2);
    });

    it("should handle empty prediction list", () => {
      const result = impactAgent({ files: [] });
      expect(result.files).toHaveLength(0);
      expect(result.totalRiskExposure).toBe(0);
    });
  });
});
