import { logger } from "@/lib/utils";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.groq_1) keys.push(process.env.groq_1);
  if (process.env.groq_2) keys.push(process.env.groq_2);
  return keys;
}

export interface ParsedScenario {
  type: "delay_fix" | "traffic_spike" | "fix_applied" | "add_tests" | "team_loss" | "critical_system";
  target?: string;
  time_multiplier?: number;
  load_factor?: number;
}

export async function parseScenario(question: string): Promise<ParsedScenario | null> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    logger.warn("ScenarioParser", "No Groq API keys configured. Using default fallback.");
    return { type: "delay_fix", target: "unknown", time_multiplier: 1.5 };
  }

  const prompt = `Convert the user's scenario into structured JSON.

Supported types:
- delay_fix
- traffic_spike
- fix_applied
- add_tests
- team_loss
- critical_system

Return JSON only. Example: { "type": "delay_fix", "target": "payment", "time_multiplier": 2 }

User input: ${question}`;

  for (const apiKey of keys) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 500,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as ParsedScenario;
      }
    } catch (err) {
      continue;
    }
  }

  return { type: "delay_fix", target: "unknown", time_multiplier: 1.5 }; // Fallback
}

export async function explainScenario(oldLoss: number, newLoss: number, scenarioType: string): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    return "Simulated scenario indicates a change in system stability and expected financial exposure.";
  }

  const prompt = `Explain the following scenario's financial impact to a CEO in a concise, easy-to-understand paragraph (3-4 sentences). 
Break down why the expected financial loss changes from ${oldLoss} to ${newLoss}, including the cause (scenario mapping: ${scenarioType}) and its effect on system stability, downtime, or business operations. Avoid technical jargon.

Input:
{
  "oldLoss": ${oldLoss},
  "newLoss": ${newLoss},
  "scenario": "${scenarioType}"
}

Output only the business explanation paragraph. Do not include introductory text or the JSON structure.`;

  for (const apiKey of keys) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.trim();
      }
    } catch (err) {
      continue;
    }
  }

  return "Simulated scenario indicates a change in system stability and expected financial exposure.";
}
