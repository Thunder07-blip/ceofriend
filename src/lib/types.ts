// ============================================================
// CEOfriend — Core Type Definitions
// Predictive Engineering Intelligence Platform
// ============================================================

// ---- Repo Analysis Agent ----

export interface RepoFile {
  file: string;
  commits: number;
  recentCommits: number;
  bugs: number;
  contributors: number;
  hasTests: boolean;
  size?: number; // File size in bytes for complexity scoring
}

export interface RepoSummary {
  totalCommits: number;
  totalBugs: number;
  totalContributors: number;
  analyzedFiles: number;
  totalFiles: number;
}

export interface RepoData {
  repo: string;
  owner: string;
  files: RepoFile[];
  summary: RepoSummary;
}

// ---- Risk Scoring Agent ----

export interface RiskBreakdown {
  volatility: number;
  bugDensity: number;
  ownership: number;
  testCoverage: number;
  uncertainty: number;
}

export interface FileRisk {
  file: string;
  riskScore: number;
  healthScore: number;
  breakdown: RiskBreakdown;
  reasons: string[];
}

export interface RiskData {
  files: FileRisk[];
  repoHealth: number;
}

// ---- Prediction Agent ----

export type RiskTrend = "increasing" | "stable" | "decreasing";

export interface FilePrediction {
  file: string;
  predictedRisk: number;
  failureProbability: number;
  riskTrend: RiskTrend;
  confidence: number;
  reasons: string[];
  // carry forward from risk
  riskScore: number;
  recentCommits: number;
  commits: number;
  bugs: number;
}

export interface PredictionData {
  files: FilePrediction[];
}

// ---- Business Impact Agent ----

export interface BusinessMapping {
  function: string;
  impactPerHour: number;
  type: "critical" | "high" | "medium" | "low";
  userImpactDescription: string;
}

export interface FileImpact {
  file: string;
  businessFunction: string;
  impactPerHour: number;
  expectedDowntime: number;
  expectedLoss: number;
  userImpact: string;
  userImpactFactor: number;
  failureFrequency: number;
  priority: number;
  failureProbability: number;
  predictedRisk: number;
  reasons: string[];
}

export interface ImpactData {
  files: FileImpact[];
  totalRiskExposure: number;
}

// ---- Report Generation Agent ----

export interface KeyRisk {
  component: string;
  riskLevel: string;
  businessImpact: string;
  expectedLoss: number;
}

export interface Report {
  summary: string;
  keyRisks: KeyRisk[];
  financialImpact: string;
  costOfInaction: string;
  recommendations: string[];
  generatedAt: string;
  confidence: string;
}

// ---- Company Context (from CEO modal) ----

export type IndustryType = "saas" | "ecommerce" | "fintech" | "healthcare" | "edtech" | "logistics" | "media" | "other";
export type TeamSize = "solo" | "small" | "medium" | "large" | "enterprise";
export type DeployFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly";

export interface CompanyContext {
  industry: IndustryType;
  description: string;
  yearlyTurnover: number; // in INR
  teamSize: TeamSize;
  criticalSystems: string[]; // e.g. ["payment", "auth", "database"]
  deployFrequency: DeployFrequency;
}

// ---- Pipeline Result ----

export interface PipelineResult {
  success: boolean;
  repoData: RepoData | null;
  riskData: RiskData | null;
  predictionData: PredictionData | null;
  impactData: ImpactData | null;
  report: Report | null;
  companyContext: CompanyContext | null;
  errors: PipelineError[];
  analyzedAt: string;
}

export interface PipelineError {
  stage: string;
  message: string;
  code: string;
}

// ---- API Types ----

export interface AnalyzeRequest {
  repoUrl: string;
  companyContext?: CompanyContext;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
