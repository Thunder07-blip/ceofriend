1. Final Feature Definition (What you are building)

“A system that detects risky files, fixes bugs using AI, shows a visual diff, and creates one PR per fix.”

⚙️ 2. Final Flow (Clean & Correct)
Table (risky files)
   ↓
Click "Heal Repo"
   ↓
For each file:
   → Fetch code
   → Detect bug (LLM)
   → Generate fix (LLM)
   → Create diff
   → Show in Monaco
   ↓
User clicks "Raise PR"
   ↓
One PR per file
🧩 3. YES — Your Idea is Correct ✅

But needs 3 critical improvements

🚨 4. CRITICAL FIXES (VERY IMPORTANT)
❗ 1. Don’t send full file blindly

👉 Instead:

Only send:
- suspicious chunk (top 50–150 lines)
Why:
cheaper
faster
more accurate
❗ 2. Don’t “replace whole file”

👉 Always do:

line-level patching

❗ 3. One bug per PR (YOU ARE RIGHT)

👉 This is very good design 👍

🧠 5. Final Architecture
Repo Healer Agent
   ├── Code Fetcher
   ├── Bug Detector (LLM)
   ├── Fix Generator (LLM)
   ├── Diff Generator
   ├── PR Creator
⚙️ 6. Backend Logic (Clean Version)
Step 1: Loop files
for (const file of riskyFiles) {
  await healFile(file);
}
Step 2: Heal File
async function healFile(file) {
  const code = await fetchFile(file);

  const bug = await detectBug(code);
  const fix = await generateFix(bug.chunk);

  const patched = applyPatch(code, bug, fix);
  const diff = generateDiff(code, patched);

  return { file, diff, patched, bug };
}
🧠 7. LLM Prompts (VERY IMPORTANT)
🔍 Bug Detection Prompt
Find the most critical bug in this code.

Return JSON:
{
  "start_line": number,
  "end_line": number,
  "bug_type": "short name",
  "reason": "simple explanation"
}
🔧 Fix Prompt
Fix this code snippet:

Rules:
- minimal change
- no refactor
- preserve structure

Return ONLY corrected code
🎨 8. Monaco Diff UI (Perfect Approach)
Use:
monaco.editor.createDiffEditor()
Feed:
original: buggyCode
modified: fixedCode
Output:
🔴 removed lines
🟢 added lines

👉 Exactly like VS Code ✅

🔘 9. UI Flow (Final)
Table:
File	Risk	Loss	Action
bug1.js	90	₹50k	Heal
On Click "Heal Repo":
For each file:
bug1.js
[ Diff Viewer ]
[ Raise PR ]
Bottom Button:
[ Raise Remaining PRs ]
🚀 10. PR Creation Logic
Steps:
Create new branch
Commit patched file
Open PR
🧠 Branch Naming (IMPORTANT FIX)

Your idea:

AI_{filename}_{bugname}_{time}

👉 GOOD, but refine:

✅ FINAL FORMAT:
ai-fix/{filename}-{bugtype}-{timestamp}
Example:
ai-fix/payment-null-check-1712345678

👉 Why better:

lowercase
URL-safe
Git-friendly
🧠 PR Title:
Fix: {bug_type} in {file}
PR Description:
- Detected by AI Repo Healer
- Issue: {reason}
- Fix: minimal patch applied
⚠️ 11. Safety Rules (VERY IMPORTANT)
MUST:
limit to top 3–5 files
show diff before PR
allow manual approval
NEVER:
auto-merge
modify multiple files in one PR
rewrite entire file
🧪 12. MVP Scope (DO THIS)
For hackathon:
1 bug per file
3 files max
no auto-detection perfection needed

# 🛠️ Repo Healer (healer.md)
## Predictive Engineering Intelligence Platform

---

## 🎯 Purpose

The Repo Healer is responsible for:

> Detecting buggy code → generating safe fixes → showing visual diffs → creating isolated pull requests

---

## 🧠 Core Philosophy

- Fix **only what is necessary**
- Maintain **developer trust**
- Ensure **safe, minimal, explainable changes**
- Never allow uncontrolled AI modifications

---

## ⚡ Core Flow


High-Risk Files (from Risk Agent)
↓
Fetch File Content
↓
LLM Bug Detection
↓
LLM Fix Generation
↓
Diff Generation
↓
User Review (Monaco Diff)
↓
PR Creation (One per file)


---

# 📦 1. INPUT

---

## From Previous Agents

Each file contains:

- file path  
- risk score  
- predicted risk  
- expected loss  

---

## Example

```json
{
  "file": "payment.js",
  "risk": 85,
  "expectedLoss": 120000
}
⚙️ 2. CODE FETCHING
GitHub API
GET /repos/{owner}/{repo}/contents/{path}
Output
Base64 encoded content → decode to string
Rule
Only fetch Top 3–5 risky files
Skip files > 3000 lines (fallback later)
🤖 3. BUG DETECTION (LLM)
Input

Full file content (MVP approach)

Prompt (STRICT)
Analyze the code and identify ONLY the most critical bug.

Rules:
- DO NOT rewrite entire file
- DO NOT refactor
- Focus only on real bugs (logic/runtime errors)

Return JSON:
{
  "start_line": number,
  "end_line": number,
  "bug_type": "short name",
  "reason": "simple explanation"
}
Output Example
{
  "start_line": 12,
  "end_line": 15,
  "bug_type": "null_check",
  "reason": "Missing validation for null input"
}
🔧 4. FIX GENERATION (LLM)
Input

Only buggy lines (extracted chunk)

Prompt (STRICT)
Fix ONLY the buggy code snippet.

Rules:
- Minimal changes only
- DO NOT rewrite entire function
- Preserve structure and formatting

Return ONLY corrected code
Output Example
if (amount <= 0) return false;
🧩 5. PATCH APPLICATION
Process
Split file into lines
Replace buggy lines
Reconstruct file
Code
const lines = code.split("\n");
lines.splice(start, end - start, ...fixedCode.split("\n"));
const patched = lines.join("\n");
🎨 6. DIFF GENERATION
Output Format
- if (amount < 0) return true;
+ if (amount <= 0) return false;
Purpose
Visual trust
Developer validation
Safe review
🖥️ 7. UI DESIGN (CRITICAL)
🔹 Main Table
File	Risk	Loss	Action
payment.js	85	₹1.2L	Heal
🔹 Heal Repo Button
Triggers healing for all listed files
🔹 Per File UI (Expanded View)
payment.js

[ Monaco Diff Viewer ]

- Red → removed code
- Green → added code

Bug: Incorrect validation logic

[ Raise PR ]
🔹 Bottom Control
[ Raise Remaining PRs ]
🔹 Monaco Integration

Use:

monaco.editor.createDiffEditor()
🔌 8. PR CREATION PLAN
Step-by-Step
Create new branch
Commit patched file
Push branch
Open pull request
🔹 Branch Naming (FINAL)
ai-fix/{filename}-{bugtype}-{timestamp}
Example
ai-fix/payment-null-check-1712345678
🔹 PR Title
Fix: {bug_type} in {file}
🔹 PR Description
- Detected by AI Repo Healer
- Issue: {reason}
- Fix: minimal safe patch applied
- No structural changes
🔹 IMPORTANT RULE
One PR per file
No combined PRs
No auto-merge
⚠️ 9. SAFETY RULES (VERY STRICT)
✅ MUST FOLLOW
Only fix small code regions
Always show diff before PR
Limit to Top 3–5 files
Preserve formatting
Keep changes minimal
Allow user approval before PR
❌ NEVER DO
Rewrite full file
Modify multiple files in one PR
Auto-merge changes
Trust LLM blindly
Change architecture
🧪 10. TESTING STRATEGY
Test Cases
simple bug fix
no bug detected
invalid LLM output
large file fallback
Validation
diff correctness
minimal change verification
PR creation success
⚡ 11. MVP SCOPE

For hackathon:

Max 3 files
One bug per file
Full file input (no chunking yet)
No auto-merge
🧠 12. FUTURE IMPROVEMENTS
Chunk-based bug detection
Multiple bugs per file
Confidence scoring
Auto test generation
PR batching