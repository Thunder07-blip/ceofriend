// ============================================================
// CEOfriend — Healer Agent
// Detects bugs via LLM, generates minimal fixes, applies patches.
// ============================================================

import { logger } from "@/lib/utils";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.groq_1) keys.push(process.env.groq_1);
  if (process.env.groq_2) keys.push(process.env.groq_2);
  return keys;
}

// ---- Types ----

export interface BugInfo {
  start_line: number;
  end_line: number;
  bug_type: string;
  reason: string;
}

export interface HealResult {
  file: string;
  original: string;
  patched: string;
  bug: BugInfo;
  diff: string;
}

// ---- LLM Calls ----

async function callGroq(prompt: string, jsonMode: boolean = false): Promise<string | null> {
  const keys = getApiKeys();
  if (keys.length === 0) return null;

  for (const apiKey of keys) {
    try {
      const body: Record<string, unknown> = {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      };
      if (jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch {
      continue;
    }
  }

  return null;
}

// ---- Bug Detection ----

export async function detectBug(code: string, filename: string): Promise<BugInfo | null> {
  logger.step("HealerAgent", `Detecting bugs in ${filename}`);

  // For very large files, only send first 300 lines
  const lines = code.split("\n");
  const truncated = lines.length > 300 ? lines.slice(0, 300).join("\n") : code;

  const prompt = `Analyze the following source code and identify ONLY the single most critical bug.

Rules:
- Focus on real bugs: logic errors, runtime errors, null/undefined issues, off-by-one, missing validation, security flaws
- DO NOT flag style issues, naming conventions, or missing comments
- DO NOT rewrite or refactor the code
- If no real bug exists, return: { "start_line": 0, "end_line": 0, "bug_type": "none", "reason": "No critical bugs found" }

File: ${filename}

\`\`\`
${truncated}
\`\`\`

Return ONLY valid JSON in this exact format:
{
  "start_line": number,
  "end_line": number,
  "bug_type": "short_name",
  "reason": "simple explanation"
}`;

  const response = await callGroq(prompt, true);
  if (!response) {
    logger.warn("HealerAgent", "LLM returned no response for bug detection");
    return null;
  }

  try {
    const parsed = JSON.parse(response) as BugInfo;
    if (parsed.bug_type === "none") {
      logger.step("HealerAgent", `No bugs found in ${filename}`);
      return null;
    }
    logger.step("HealerAgent", `Bug detected: ${parsed.bug_type} (lines ${parsed.start_line}-${parsed.end_line})`);
    return parsed;
  } catch {
    logger.error("HealerAgent", "Failed to parse bug detection response");
    return null;
  }
}

// ---- Fix Generation ----

export async function generateFix(code: string, bug: BugInfo): Promise<string | null> {
  logger.step("HealerAgent", `Generating fix for ${bug.bug_type}`);

  // Extract the buggy chunk (with some context lines)
  const lines = code.split("\n");
  const contextPad = 3;
  const start = Math.max(0, bug.start_line - 1 - contextPad);
  const end = Math.min(lines.length, bug.end_line + contextPad);
  const chunk = lines.slice(start, end).join("\n");

  const prompt = `Fix ONLY the buggy code in this snippet.

Bug: ${bug.bug_type}
Reason: ${bug.reason}
Buggy lines: ${bug.start_line} to ${bug.end_line}

\`\`\`
${chunk}
\`\`\`

Rules:
- Minimal changes ONLY — fix the bug, nothing else
- DO NOT rewrite the entire function
- DO NOT refactor or rename variables
- DO NOT add comments
- Preserve indentation and formatting exactly
- Return ONLY the corrected code snippet (same line range), no explanation, no markdown fences`;

  const response = await callGroq(prompt, false);
  if (!response) {
    logger.warn("HealerAgent", "LLM returned no fix");
    return null;
  }

  // Strip markdown fences if LLM added them anyway
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
  }

  return cleaned;
}

// ---- Patch Application ----

export function applyPatch(originalCode: string, bug: BugInfo, fixedChunk: string): string {
  const lines = originalCode.split("\n");
  const contextPad = 3;
  const start = Math.max(0, bug.start_line - 1 - contextPad);
  const end = Math.min(lines.length, bug.end_line + contextPad);

  const fixedLines = fixedChunk.split("\n");

  // Replace the chunk
  const before = lines.slice(0, start);
  const after = lines.slice(end);

  return [...before, ...fixedLines, ...after].join("\n");
}

// ---- Diff Generation ----

export function generateTextDiff(original: string, patched: string): string {
  const origLines = original.split("\n");
  const patchLines = patched.split("\n");
  const diffLines: string[] = [];

  const maxLen = Math.max(origLines.length, patchLines.length);

  // Simple line-by-line diff
  let i = 0;
  let j = 0;

  while (i < origLines.length || j < patchLines.length) {
    const origLine = i < origLines.length ? origLines[i] : undefined;
    const patchLine = j < patchLines.length ? patchLines[j] : undefined;

    if (origLine === patchLine) {
      diffLines.push(`  ${origLine}`);
      i++;
      j++;
    } else if (origLine !== undefined && (patchLine === undefined || origLine !== patchLines[j])) {
      diffLines.push(`- ${origLine}`);
      i++;
    } else {
      diffLines.push(`+ ${patchLine}`);
      j++;
    }

    // Safety cap
    if (diffLines.length > maxLen + 100) break;
  }

  return diffLines.join("\n");
}

// ---- Full Heal Pipeline ----

export async function healFile(code: string, filename: string): Promise<HealResult | null> {
  const bug = await detectBug(code, filename);
  if (!bug) return null;

  const fix = await generateFix(code, bug);
  if (!fix) return null;

  const patched = applyPatch(code, bug, fix);
  const diff = generateTextDiff(code, patched);

  return {
    file: filename,
    original: code,
    patched,
    bug,
    diff,
  };
}
