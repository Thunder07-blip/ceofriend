// ============================================================
// CEOfriend — Business Impact Agent
// Maps technical risks → financial impact.
// Uses a structured business context layer (NOT LLM guessing).
// Now enhanced with CEO-provided company context.
// ============================================================

import type { PredictionData, ImpactData, FileImpact, BusinessMapping, CompanyContext } from "@/lib/types";
import { logger } from "@/lib/utils";

// ---- Industry Revenue Multipliers ----
// Scales the base impactPerHour relative to a "standard" ₹10Cr company
const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  fintech: 1.5,
  ecommerce: 1.3,
  saas: 1.0,
  healthcare: 1.2,
  edtech: 0.7,
  logistics: 0.9,
  media: 0.6,
  other: 0.8,
};

// ---- Business Context Mapping (Keyword-Based) ----

const BUSINESS_MAPPINGS: Record<string, BusinessMapping> = {
  payment: {
    function: "Revenue Generation",
    impactPerHour: 200000,
    type: "critical",
    userImpactDescription: "Transaction failures and payment processing disruption",
  },
  billing: {
    function: "Revenue Generation",
    impactPerHour: 180000,
    type: "critical",
    userImpactDescription: "Billing cycle disruption affecting revenue collection",
  },
  checkout: {
    function: "Revenue Generation",
    impactPerHour: 150000,
    type: "critical",
    userImpactDescription: "Checkout flow failure blocking purchases",
  },
  order: {
    function: "Order Management",
    impactPerHour: 120000,
    type: "critical",
    userImpactDescription: "Order processing failures and fulfillment delays",
  },
  transaction: {
    function: "Revenue Generation",
    impactPerHour: 200000,
    type: "critical",
    userImpactDescription: "Financial transaction processing failures",
  },
  auth: {
    function: "User Access",
    impactPerHour: 50000,
    type: "high",
    userImpactDescription: "Users unable to log in or access their accounts",
  },
  login: {
    function: "User Access",
    impactPerHour: 50000,
    type: "high",
    userImpactDescription: "Login system failure blocking user access",
  },
  signup: {
    function: "User Acquisition",
    impactPerHour: 40000,
    type: "high",
    userImpactDescription: "New user registration failures",
  },
  security: {
    function: "Security & Compliance",
    impactPerHour: 100000,
    type: "critical",
    userImpactDescription: "Security vulnerabilities and potential data exposure",
  },
  database: {
    function: "Data Infrastructure",
    impactPerHour: 150000,
    type: "critical",
    userImpactDescription: "Data storage and retrieval failures",
  },
  db: {
    function: "Data Infrastructure",
    impactPerHour: 150000,
    type: "critical",
    userImpactDescription: "Database connectivity and query failures",
  },
  api: {
    function: "Service Integration",
    impactPerHour: 80000,
    type: "high",
    userImpactDescription: "API endpoint failures affecting integrations",
  },
  search: {
    function: "User Experience",
    impactPerHour: 30000,
    type: "medium",
    userImpactDescription: "Search functionality degradation",
  },
  notification: {
    function: "User Communication",
    impactPerHour: 20000,
    type: "medium",
    userImpactDescription: "Notification delivery failures",
  },
  email: {
    function: "User Communication",
    impactPerHour: 25000,
    type: "medium",
    userImpactDescription: "Email delivery and communication failures",
  },
  user: {
    function: "User Management",
    impactPerHour: 40000,
    type: "high",
    userImpactDescription: "User profile and account management issues",
  },
  cart: {
    function: "Revenue Generation",
    impactPerHour: 100000,
    type: "critical",
    userImpactDescription: "Shopping cart functionality failures",
  },
  inventory: {
    function: "Operations",
    impactPerHour: 60000,
    type: "high",
    userImpactDescription: "Inventory tracking and availability issues",
  },
  shipping: {
    function: "Fulfillment",
    impactPerHour: 50000,
    type: "high",
    userImpactDescription: "Shipping calculation and tracking failures",
  },
  report: {
    function: "Business Intelligence",
    impactPerHour: 15000,
    type: "low",
    userImpactDescription: "Reporting and analytics unavailability",
  },
  analytics: {
    function: "Business Intelligence",
    impactPerHour: 15000,
    type: "low",
    userImpactDescription: "Analytics tracking unavailable",
  },
  dashboard: {
    function: "Business Intelligence",
    impactPerHour: 15000,
    type: "low",
    userImpactDescription: "Dashboard and monitoring unavailability",
  },
};

/**
 * Default mapping for files that don't match any keyword.
 */
const DEFAULT_MAPPING: BusinessMapping = {
  function: "General Operations",
  impactPerHour: 10000,
  type: "low",
  userImpactDescription: "General system functionality impact",
};

/**
 * Calculate turnover-based scaling factor.
 * Base assumption: ₹10 Crore (~₹10,00,00,000) annual turnover.
 * If CEO provides actual turnover, scale proportionally.
 */
function getTurnoverScale(yearlyTurnover?: number): number {
  if (!yearlyTurnover || yearlyTurnover <= 0) return 1;
  const baseTurnover = 10_00_00_000; // ₹10 Crore
  // FIX 6: Turnover Normalization strict bounding
  return Math.max(0.3, Math.min(3.0, yearlyTurnover / baseTurnover));
}

/**
 * Check if a file's keyword is in the CEO's critical systems list.
 * Critical systems get a 1.5x boost.
 */
function getCriticalBoost(filename: string, criticalSystems?: string[]): number {
  if (!criticalSystems || criticalSystems.length === 0) return 1;
  const lower = filename.toLowerCase();
  for (const system of criticalSystems) {
    if (lower.includes(system.toLowerCase())) return 1.5;
  }
  return 1;
}

/**
 * Match a file name to a business context using keyword detection.
 */
export function getBusinessMapping(filename: string): BusinessMapping {
  const lower = filename.toLowerCase();

  for (const [keyword, mapping] of Object.entries(BUSINESS_MAPPINGS)) {
    if (lower.includes(keyword)) {
      return mapping;
    }
  }

  return DEFAULT_MAPPING;
}

/**
 * Get User Impact Factor (U_impact) based on semantic mapping.
 * Payment: 0.9, Auth: 0.7, Search: 0.5, Analytics: 0.3, Default: 0.5
 */
function getUserImpactFactor(filename: string): number {
  const lower = filename.toLowerCase();
  if (lower.includes("payment") || lower.includes("checkout") || lower.includes("billing") || lower.includes("transaction") || lower.includes("cart")) return 0.9;
  if (lower.includes("auth") || lower.includes("login") || lower.includes("user") || lower.includes("signup")) return 0.7;
  if (lower.includes("search")) return 0.5;
  if (lower.includes("analytics") || lower.includes("report") || lower.includes("dashboard")) return 0.3;
  return 0.5; // Default for others
}

/**
 * Estimate expected downtime hours based on predicted risk.
 */
function estimateDowntime(predictedRisk: number): number {
  if (predictedRisk >= 80) return 3;
  if (predictedRisk >= 50) return 2;
  return 1;
}

/**
 * Calculate expected Failure Frequency (F_exp)
 */
function calculateFailureFrequency(predictedRisk: number): number {
  return 1 + (predictedRisk / 50);
}

/**
 * Generate explanation reasons for the business impact.
 */
function generateImpactReasons(
  mapping: BusinessMapping,
  failureProbability: number,
  expectedLoss: number
): string[] {
  const reasons: string[] = [];

  if (mapping.type === "critical") {
    reasons.push(`Handles critical business function: ${mapping.function}`);
  } else if (mapping.type === "high") {
    reasons.push(`Important business function: ${mapping.function}`);
  }

  if (failureProbability > 0.7) {
    reasons.push("High likelihood of failure in next 90 days");
  } else if (failureProbability > 0.4) {
    reasons.push("Moderate likelihood of failure");
  }

  if (expectedLoss > 300000) {
    reasons.push("Significant financial exposure");
  } else if (expectedLoss > 100000) {
    reasons.push("Notable financial risk");
  }

  reasons.push(mapping.userImpactDescription);

  return reasons;
}

/**
 * Calculate business impact for a single file.
 */
export function calculateFileImpact(
  file: {
    file: string;
    predictedRisk: number;
    failureProbability: number;
  },
  scale: number = 1
): FileImpact {
  const mapping = getBusinessMapping(file.file);
  const downtime = estimateDowntime(file.predictedRisk);
  const userImpactFactor = getUserImpactFactor(file.file);
  const failureFrequency = calculateFailureFrequency(file.predictedRisk);
  
  const scaledImpact = Math.round(mapping.impactPerHour * scale);
  
  // FINAL EQUATION: E_loss = P_fail * C_hour * T_down * U_impact * F_exp
  const expectedLoss = Math.round(
    file.failureProbability * scaledImpact * downtime * userImpactFactor * failureFrequency
  );

  return {
    file: file.file,
    businessFunction: mapping.function,
    impactPerHour: scaledImpact,
    expectedDowntime: downtime,
    expectedLoss,
    userImpact: mapping.userImpactDescription,
    userImpactFactor,
    failureFrequency,
    priority: 0, // Will be set after sorting
    failureProbability: file.failureProbability,
    predictedRisk: file.predictedRisk,
    reasons: generateImpactReasons(mapping, file.failureProbability, expectedLoss),
  };
}

// ---- Public API ----

/**
 * Business Impact Agent: maps technical predictions to financial impact.
 * Now accepts optional CompanyContext to scale and prioritize results.
 * Pure function — no external calls, fully deterministic.
 */
export function impactAgent(
  predictionData: PredictionData,
  companyContext?: CompanyContext | null
): ImpactData {
  logger.step("ImpactAgent", `Calculating business impact for ${predictionData.files.length} files`);

  // Calculate composite scaling factor
  const industryMul = INDUSTRY_MULTIPLIERS[companyContext?.industry || "other"] || 1;
  const turnoverScale = getTurnoverScale(companyContext?.yearlyTurnover);
  const compositeScale = industryMul * turnoverScale;

  if (companyContext) {
    logger.step("ImpactAgent", `Company context: ${companyContext.industry}, turnover scale: ${turnoverScale.toFixed(2)}, composite: ${compositeScale.toFixed(2)}`);
  }

  const files: FileImpact[] = predictionData.files.map((file) => {
    const criticalBoost = getCriticalBoost(file.file, companyContext?.criticalSystems);
    return calculateFileImpact(
      {
        file: file.file,
        predictedRisk: file.predictedRisk,
        failureProbability: file.failureProbability,
      },
      compositeScale * criticalBoost
    );
  });

  // Sort by expected loss (descending) and assign priority
  files.sort((a, b) => b.expectedLoss - a.expectedLoss);
  files.forEach((file, index) => {
    file.priority = index + 1;
  });

  // Calculate total risk exposure
  const totalRiskExposure = files.reduce((sum, f) => sum + f.expectedLoss, 0);

  logger.step("ImpactAgent", `Total risk exposure: ₹${totalRiskExposure.toLocaleString("en-IN")}`);

  return { files, totalRiskExposure };
}
