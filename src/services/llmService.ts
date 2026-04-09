// ============================================================
// CEOfriend — LLM Service
// Uses Groq API with dual-key failover for report generation.
// Falls back to template-based report if ALL LLM calls fail.
// ============================================================

import { logger } from "@/lib/utils";
import type { ImpactData, Report, KeyRisk, CompanyContext } from "@/lib/types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Get available Groq API keys in order of preference.
 */
function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.groq_1) keys.push(process.env.groq_1);
  if (process.env.groq_2) keys.push(process.env.groq_2);
  return keys;
}

/**
 * Call Groq API with a specific key.
 */
async function callGroq(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a senior business consultant. You explain technical engineering risks to CEOs in clear, simple business language. Focus on financial impact, user impact, and actionable recommendations. Avoid all technical jargon. Be concise but thorough.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };

    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    logger.error("LLM", `Groq call failed`, err);
    return null;
  }
}

/**
 * Build the LLM prompt from structured impact data.
 */
function buildPrompt(impactData: ImpactData, repoHealth: number, companyContext?: CompanyContext | null): string {
  const topRisks = impactData.files
    .sort((a, b) => b.expectedLoss - a.expectedLoss)
    .slice(0, 5);

  const riskSummary = topRisks
    .map(
      (f, i) =>
        `${i + 1}. ${f.file} — ${f.businessFunction}, failure probability: ${(f.failureProbability * 100).toFixed(0)}%, expected loss: ₹${f.expectedLoss.toLocaleString("en-IN")}, user impact: ${f.userImpact}`
    )
    .join("\n");

  // Build company context block if provided
  let companyBlock = "";
  if (companyContext) {
    const parts: string[] = [];
    parts.push(`Industry: ${companyContext.industry}`);
    if (companyContext.description) {
      parts.push(`Company Description: ${companyContext.description}`);
    }
    if (companyContext.yearlyTurnover > 0) {
      parts.push(`Annual Turnover: ₹${companyContext.yearlyTurnover.toLocaleString("en-IN")}`);
    }
    parts.push(`Team Size: ${companyContext.teamSize}`);
    parts.push(`Deploy Frequency: ${companyContext.deployFrequency}`);
    if (companyContext.criticalSystems.length > 0) {
      parts.push(`CEO-marked Critical Systems: ${companyContext.criticalSystems.join(", ")}`);
    }
    companyBlock = `\n\nCompany Context (provided by the CEO):\n${parts.join("\n")}\n`;
  }

  return `You are analyzing a software system for a CEO.${companyBlock}

System Health Score: ${repoHealth}/100
Total Financial Risk Exposure: ₹${impactData.totalRiskExposure.toLocaleString("en-IN")}

Top Risk Components:
${riskSummary}

Generate a CEO report with these EXACT sections (use these headers):

1. EXECUTIVE SUMMARY — 3-4 sentences explaining overall system health and risk in business terms.${companyContext?.description ? " Reference the company's specific business context." : ""}

2. KEY RISKS — For each major risk, state the component name, risk level, and business impact in one sentence each.

3. FINANCIAL IMPACT — One paragraph quantifying total financial exposure and which areas contribute most.${companyContext?.yearlyTurnover ? " Express the loss as a percentage of annual turnover." : ""}

4. COST OF INACTION — One paragraph explaining what happens if these risks are ignored for 90 days.

5. RECOMMENDATIONS — 3-5 prioritized action items the CEO should authorize.

Rules:
- Use Indian Rupees (₹) for all amounts
- No technical jargon — a non-technical person must understand every word
- Be specific with numbers
- Tone: confident, advisory, professional${companyContext ? "\n- Reference the company's industry and context where relevant" : ""}`;
}

/**
 * Parse LLM response into structured Report sections.
 */
function parseLLMResponse(text: string, impactData: ImpactData): Report {
  const sections: Record<string, string> = {};
  const sectionNames = [
    "EXECUTIVE SUMMARY",
    "KEY RISKS",
    "FINANCIAL IMPACT",
    "COST OF INACTION",
    "RECOMMENDATIONS",
  ];

  // Split by section headers
  let currentSection = "";
  for (const line of text.split("\n")) {
    const upperLine = line.toUpperCase().replace(/[#*\d.]+/g, "").trim();
    const matchedSection = sectionNames.find((s) => upperLine.includes(s));
    if (matchedSection) {
      currentSection = matchedSection;
      sections[currentSection] = "";
    } else if (currentSection) {
      sections[currentSection] = (sections[currentSection] + "\n" + line).trim();
    }
  }

  // Extract recommendations as array
  const recsText = sections["RECOMMENDATIONS"] || "";
  const recommendations = recsText
    .split("\n")
    .map((line) => line.replace(/^[\d\-.*]+\s*/, "").trim())
    .filter((line) => line.length > 10);

  // Build key risks array
  const keyRisks: KeyRisk[] = impactData.files
    .sort((a, b) => b.expectedLoss - a.expectedLoss)
    .slice(0, 3)
    .map((f) => ({
      component: f.file,
      riskLevel: f.predictedRisk >= 80 ? "Critical" : f.predictedRisk >= 60 ? "High" : "Medium",
      businessImpact: f.userImpact,
      expectedLoss: f.expectedLoss,
    }));

  return {
    summary: sections["EXECUTIVE SUMMARY"] || "Analysis complete. Please review the risk details below.",
    keyRisks,
    financialImpact: sections["FINANCIAL IMPACT"] || `Total risk exposure: ₹${impactData.totalRiskExposure.toLocaleString("en-IN")}`,
    costOfInaction: sections["COST OF INACTION"] || "Delaying action on identified risks may lead to increased financial exposure and system instability.",
    recommendations: recommendations.length > 0 ? recommendations : [
      "Prioritize fixes for the highest-risk components",
      "Improve test coverage in critical areas",
      "Monitor high-change areas closely",
    ],
    generatedAt: new Date().toISOString(),
    confidence: "high",
  };
}

/**
 * Generate a deterministic fallback report when LLM is unavailable.
 */
function generateFallbackReport(impactData: ImpactData, repoHealth: number): Report {
  logger.warn("LLM", "Using template-based fallback report generation");

  const topRisks = impactData.files
    .sort((a, b) => b.expectedLoss - a.expectedLoss)
    .slice(0, 3);

  const riskLevel = repoHealth >= 70 ? "moderate" : repoHealth >= 40 ? "elevated" : "critical";
  const totalExposure = impactData.totalRiskExposure;

  const keyRisks: KeyRisk[] = topRisks.map((f) => ({
    component: f.file,
    riskLevel: f.predictedRisk >= 80 ? "Critical" : f.predictedRisk >= 60 ? "High" : "Medium",
    businessImpact: f.userImpact,
    expectedLoss: f.expectedLoss,
  }));

  const topComponent = topRisks[0];
  const topLoss = topComponent
    ? `₹${topComponent.expectedLoss.toLocaleString("en-IN")}`
    : "₹0";

  return {
    summary: `Your system health score is ${repoHealth}/100, indicating ${riskLevel} risk levels. The total potential financial exposure over the next 90 days is estimated at ₹${totalExposure.toLocaleString("en-IN")}. ${topComponent ? `The ${topComponent.file} component represents the highest risk, with a potential loss of ${topLoss}.` : ""} Immediate attention is recommended for the identified high-risk areas.`,
    keyRisks,
    financialImpact: `The total projected financial exposure is approximately ₹${totalExposure.toLocaleString("en-IN")}. ${topComponent ? `The ${topComponent.businessFunction} area (${topComponent.file}) contributes the largest portion at ${topLoss}.` : ""}`,
    costOfInaction: `Delaying fixes on the identified high-risk components may result in service disruptions, revenue loss, and declining customer trust. Over 90 days, cumulative losses could escalate beyond the current projected ₹${totalExposure.toLocaleString("en-IN")}.`,
    recommendations: [
      ...(topRisks.length > 0
        ? [`Immediately stabilize ${topRisks[0].file} — this is the highest-risk component affecting ${topRisks[0].businessFunction}`]
        : []),
      "Increase test coverage for all high-risk modules to reduce failure probability",
      "Establish monitoring and alerting for components with high change frequency",
      "Conduct a code review sprint focused on the top 5 riskiest files",
      "Create an incident response plan for potential failures in critical systems",
    ],
    generatedAt: new Date().toISOString(),
    confidence: "medium",
  };
}

// ---- Public API ----

/**
 * Generate a CEO-friendly report using LLM with dual-key failover.
 * Falls back to template-based generation if all LLM calls fail.
 */
export async function generateReport(
  impactData: ImpactData,
  repoHealth: number,
  companyContext?: CompanyContext | null
): Promise<Report> {
  logger.step("LLM", "Generating CEO report...");

  const keys = getApiKeys();

  if (keys.length === 0) {
    logger.warn("LLM", "No Groq API keys configured. Using fallback report.");
    return generateFallbackReport(impactData, repoHealth);
  }

  const prompt = buildPrompt(impactData, repoHealth, companyContext);

  // Try each key in sequence
  for (let i = 0; i < keys.length; i++) {
    logger.step("LLM", `Trying Groq key ${i + 1}/${keys.length}...`);
    const response = await callGroq(prompt, keys[i]);

    if (response) {
      logger.step("LLM", "LLM report generated successfully");
      return parseLLMResponse(response, impactData);
    }
  }

  // All keys failed — use fallback
  logger.warn("LLM", "All Groq keys exhausted. Using fallback report.");
  return generateFallbackReport(impactData, repoHealth);
}
