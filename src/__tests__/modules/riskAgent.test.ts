// ============================================================
// CEOfriend — Risk Agent Tests
// Tests deterministic scoring formula and edge cases
// ============================================================

import { calculateFileRisk, riskAgent } from "@/modules/riskAgent";
import type { RepoData } from "@/lib/types";

describe("Risk Scoring Agent", () => {
  describe("calculateFileRisk", () => {
    it("should produce higher risk for high commits", () => {
      const result = calculateFileRisk({
        file: "payment.py",
        commits: 100,
        recentCommits: 50,
        bugs: 1,
        contributors: 5,
        hasTests: true,
      });

      expect(result.riskScore).toBeGreaterThan(30);
      expect(result.healthScore).toBeLessThan(70);
      expect(result.breakdown.volatility).toBe(100); // 50 * 2 = 100
    });

    it("should produce higher risk for no tests", () => {
      const withTests = calculateFileRisk({
        file: "auth.ts",
        commits: 20,
        recentCommits: 5,
        bugs: 2,
        contributors: 3,
        hasTests: true,
      });

      const noTests = calculateFileRisk({
        file: "auth.ts",
        commits: 20,
        recentCommits: 5,
        bugs: 2,
        contributors: 3,
        hasTests: false,
      });

      expect(noTests.riskScore).toBeGreaterThan(withTests.riskScore);
      expect(noTests.breakdown.testCoverage).toBe(100);
      expect(withTests.breakdown.testCoverage).toBe(20);
    });

    it("should handle zero commits without crashing", () => {
      const result = calculateFileRisk({
        file: "empty.ts",
        commits: 0,
        recentCommits: 0,
        bugs: 0,
        contributors: 1,
        hasTests: false,
      });

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      // bugDensity should be 0 (safeDivide)
      expect(result.breakdown.bugDensity).toBe(0);
    });

    it("should cap risk score at 100", () => {
      const result = calculateFileRisk({
        file: "extreme.ts",
        commits: 1,
        recentCommits: 999,
        bugs: 999,
        contributors: 1,
        hasTests: false,
      });

      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it("should be deterministic (same input = same output)", () => {
      const input = {
        file: "test.ts",
        commits: 50,
        recentCommits: 20,
        bugs: 5,
        contributors: 2,
        hasTests: true,
      };

      const result1 = calculateFileRisk(input);
      const result2 = calculateFileRisk(input);

      expect(result1.riskScore).toBe(result2.riskScore);
      expect(result1.healthScore).toBe(result2.healthScore);
    });

    it("should calculate ownership risk correctly", () => {
      const single = calculateFileRisk({
        file: "solo.ts",
        commits: 10,
        recentCommits: 2,
        bugs: 0,
        contributors: 1,
        hasTests: true,
      });

      const team = calculateFileRisk({
        file: "team.ts",
        commits: 10,
        recentCommits: 2,
        bugs: 0,
        contributors: 10,
        hasTests: true,
      });

      expect(single.breakdown.ownership).toBe(100);
      expect(team.breakdown.ownership).toBe(20);
    });

    it("should generate meaningful reasons", () => {
      const result = calculateFileRisk({
        file: "risky.ts",
        commits: 100,
        recentCommits: 50,
        bugs: 20,
        contributors: 1,
        hasTests: false,
      });

      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons.some((r) => r.includes("commit") || r.includes("change"))).toBe(true);
    });
  });

  describe("riskAgent", () => {
    it("should score all files and compute repo health", () => {
      const repoData: RepoData = {
        repo: "test-repo",
        owner: "test",
        files: [
          { file: "a.ts", commits: 50, recentCommits: 20, bugs: 5, contributors: 3, hasTests: true },
          { file: "b.ts", commits: 10, recentCommits: 1, bugs: 0, contributors: 5, hasTests: true },
        ],
        summary: { totalCommits: 60, totalBugs: 5, totalContributors: 5, analyzedFiles: 2 },
      };

      const result = riskAgent(repoData);

      expect(result.files).toHaveLength(2);
      expect(result.repoHealth).toBeGreaterThanOrEqual(0);
      expect(result.repoHealth).toBeLessThanOrEqual(100);
      // Files should be sorted by risk (highest first)
      expect(result.files[0].riskScore).toBeGreaterThanOrEqual(result.files[1].riskScore);
    });

    it("should handle empty file list", () => {
      const repoData: RepoData = {
        repo: "empty-repo",
        owner: "test",
        files: [],
        summary: { totalCommits: 0, totalBugs: 0, totalContributors: 0, analyzedFiles: 0 },
      };

      const result = riskAgent(repoData);
      expect(result.files).toHaveLength(0);
      expect(result.repoHealth).toBe(100);
    });
  });
});
