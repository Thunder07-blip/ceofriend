// ============================================================
// CEOfriend — Prediction Agent Tests
// Tests trend analysis, growth factor, and failure probability
// ============================================================

import { predictFile } from "@/modules/predictionAgent";

describe("Prediction Agent", () => {
  describe("predictFile", () => {
    it("should predict higher risk when growth is high", () => {
      const result = predictFile({
        file: "payment.py",
        riskScore: 80,
        commits: 100,
        recentCommits: 50,
        bugs: 10,
      });

      expect(result.predictedRisk).toBeGreaterThan(80);
      expect(result.failureProbability).toBeGreaterThan(0.8);
    });

    it("should detect increasing trend", () => {
      const result = predictFile({
        file: "growing.ts",
        riskScore: 60,
        commits: 50,
        recentCommits: 30,
        bugs: 10,
      });

      expect(result.riskTrend).toBe("increasing");
    });

    it("should detect stable trend", () => {
      const result = predictFile({
        file: "stable.ts",
        riskScore: 40,
        commits: 100,
        recentCommits: 15,
        bugs: 1,
      });

      expect(result.riskTrend).toBe("stable");
    });

    it("should handle zero commits without crashing", () => {
      const result = predictFile({
        file: "new.ts",
        riskScore: 50,
        commits: 0,
        recentCommits: 0,
        bugs: 0,
      });

      expect(result.predictedRisk).toBeGreaterThanOrEqual(0);
      expect(result.predictedRisk).toBeLessThanOrEqual(100);
      expect(result.failureProbability).toBeGreaterThanOrEqual(0);
    });

    it("should cap predicted risk at 100", () => {
      const result = predictFile({
        file: "extreme.ts",
        riskScore: 95,
        commits: 10,
        recentCommits: 10,
        bugs: 10,
      });

      expect(result.predictedRisk).toBeLessThanOrEqual(100);
    });

    it("should produce higher confidence with more data", () => {
      const lowData = predictFile({
        file: "sparse.ts",
        riskScore: 50,
        commits: 5,
        recentCommits: 2,
        bugs: 0,
      });

      const highData = predictFile({
        file: "rich.ts",
        riskScore: 50,
        commits: 200,
        recentCommits: 50,
        bugs: 30,
      });

      expect(highData.confidence).toBeGreaterThan(lowData.confidence);
    });

    it("should be deterministic", () => {
      const input = {
        file: "test.ts",
        riskScore: 60,
        commits: 80,
        recentCommits: 30,
        bugs: 5,
      };

      const r1 = predictFile(input);
      const r2 = predictFile(input);

      expect(r1.predictedRisk).toBe(r2.predictedRisk);
      expect(r1.failureProbability).toBe(r2.failureProbability);
      expect(r1.confidence).toBe(r2.confidence);
    });

    it("should generate meaningful reasons", () => {
      const result = predictFile({
        file: "risky.ts",
        riskScore: 85,
        commits: 100,
        recentCommits: 60,
        bugs: 15,
      });

      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
