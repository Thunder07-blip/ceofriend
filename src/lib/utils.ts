// ============================================================
// CEOfriend — Utility Functions
// ============================================================

/**
 * Format a number as Indian Rupees currency string.
 * Example: 408000 → "₹4,08,000"
 */
export function formatCurrency(amount: number): string {
  if (amount < 0) amount = 0;
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe division that returns a fallback on divide-by-zero.
 */
export function safeDivide(a: number, b: number, fallback: number = 0): number {
  if (b === 0) return fallback;
  return a / b;
}

/**
 * Parse a GitHub repo URL into owner and repo name.
 * Supports formats:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   github.com/owner/repo
 */
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Remove trailing slashes and .git suffix
    const cleaned = url.replace(/\/+$/, "").replace(/\.git$/, "");

    // Try URL parsing
    let pathname: string;
    if (cleaned.startsWith("http")) {
      const parsed = new URL(cleaned);
      pathname = parsed.pathname;
    } else if (cleaned.includes("github.com")) {
      const parts = cleaned.split("github.com");
      pathname = parts[1] || "";
    } else {
      return null;
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;

    return { owner: segments[0], repo: segments[1] };
  } catch {
    return null;
  }
}

/**
 * Get human-readable risk level from a risk score (0–100).
 */
export function getRiskLevel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "MINIMAL";
}

/**
 * Get CSS color class for a risk level.
 */
export function getRiskColor(score: number): string {
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
}

/**
 * Structured logger for pipeline debugging.
 */
export const logger = {
  step(stage: string, message: string) {
    console.log(`[CEOfriend][${stage}] ${message}`);
  },
  error(stage: string, message: string, err?: unknown) {
    console.error(`[CEOfriend][${stage}] ERROR: ${message}`, err instanceof Error ? err.message : "");
  },
  warn(stage: string, message: string) {
    console.warn(`[CEOfriend][${stage}] WARN: ${message}`);
  },
};
