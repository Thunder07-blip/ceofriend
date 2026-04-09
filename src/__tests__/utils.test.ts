// ============================================================
// CEOfriend — Utility Tests
// Tests for parseRepoUrl, formatCurrency, safeDivide, etc.
// ============================================================

import { parseRepoUrl, formatCurrency, safeDivide, clamp, getRiskLevel } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("parseRepoUrl", () => {
    it("should parse standard GitHub URL", () => {
      const result = parseRepoUrl("https://github.com/facebook/react");
      expect(result).toEqual({ owner: "facebook", repo: "react" });
    });

    it("should parse URL with .git suffix", () => {
      const result = parseRepoUrl("https://github.com/owner/repo.git");
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should parse URL with trailing slash", () => {
      const result = parseRepoUrl("https://github.com/owner/repo/");
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should return null for invalid URLs", () => {
      expect(parseRepoUrl("not-a-url")).toBeNull();
      expect(parseRepoUrl("https://gitlab.com/only-owner")).toBeNull();
      expect(parseRepoUrl("")).toBeNull();
    });

    it("should handle URL without protocol", () => {
      const result = parseRepoUrl("github.com/owner/repo");
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });
  });

  describe("formatCurrency", () => {
    it("should format large numbers in Indian style", () => {
      const result = formatCurrency(408000);
      expect(result).toContain("₹");
      expect(result).toContain("4");
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("₹0");
    });

    it("should handle negative as zero", () => {
      expect(formatCurrency(-100)).toBe("₹0");
    });
  });

  describe("safeDivide", () => {
    it("should divide normally", () => {
      expect(safeDivide(10, 2)).toBe(5);
    });

    it("should return fallback on zero divisor", () => {
      expect(safeDivide(10, 0)).toBe(0);
      expect(safeDivide(10, 0, -1)).toBe(-1);
    });
  });

  describe("clamp", () => {
    it("should clamp within range", () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
    });
  });

  describe("getRiskLevel", () => {
    it("should return correct labels", () => {
      expect(getRiskLevel(90)).toBe("CRITICAL");
      expect(getRiskLevel(70)).toBe("HIGH");
      expect(getRiskLevel(50)).toBe("MEDIUM");
      expect(getRiskLevel(30)).toBe("LOW");
      expect(getRiskLevel(10)).toBe("MINIMAL");
    });
  });
});
