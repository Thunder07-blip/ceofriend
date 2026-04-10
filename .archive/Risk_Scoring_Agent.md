# ⚠️ Risk Scoring Agent (risk_agent.md)

---

## 🎯 Purpose

The **Risk Scoring Agent** converts raw repository signals into **quantified risk scores**.

> It answers:
👉 “How risky is each part of the codebase?”

---

## 🧠 Core Idea

We do NOT use black-box ML.

Instead:

> 👉 Use **deterministic, explainable scoring logic**

This ensures:
- Reliability ✅
- Transparency ✅
- Trust (very important for CEOs) ✅

---

## 🚀 Responsibilities

The Risk Agent must:

1. Take structured repo data (from Repo Agent)  
2. Compute risk scores for each file  
3. Aggregate into overall repo health score  
4. Provide explanation for each score  

---

## ❗ What It DOES NOT DO

- ❌ No prediction  
- ❌ No business mapping  
- ❌ No LLM usage  

👉 Only **risk calculation**

---

# 📥 Input

From Repo Analysis Agent:

```json
{
  "files": [
    {
      "file": "payment.py",
      "commits": 120,
      "recentCommits": 40,
      "bugs": 10,
      "contributors": 3,
      "hasTests": false
    }
  ]
}
``` id="risk-input"

---

# 📤 Output

---

## Example

```json
{
  "files": [
    {
      "file": "payment.py",
      "riskScore": 87,
      "healthScore": 13,
      "breakdown": {
        "volatility": 80,
        "bugDensity": 70,
        "ownership": 60,
        "testCoverage": 100
      },
      "reasons": [
        "High commit activity",
        "Multiple bug reports",
        "No test coverage"
      ]
    }
  ],
  "repoHealth": 68
}
``` id="risk-output"

---

# 🧠 Risk Model Design

---

## 🎯 Philosophy

Risk is based on 4 core dimensions:

---

## 🔴 1. Volatility (Change Instability)

Measures:
- How frequently code changes

Why:
- More changes → higher chance of bugs

---

## 🟠 2. Bug Density (Reliability)

Measures:
- Bugs relative to commits

Why:
- More bugs → less stable system

---

## 🟡 3. Ownership Risk

Measures:
- Contributor distribution

Why:
- Low contributors → high dependency risk

---

## 🟢 4. Test Confidence

Measures:
- Presence of tests

Why:
- No tests → higher failure risk

---

---

# 🧮 Scoring Formula

---

## Step 1: Normalize Each Metric (0–100)

---

### 🔴 Volatility Score

```text
volatility = min(100, recentCommits * 2)
``` id="volatility-formula"

---

### 🟠 Bug Density Score

```text
bugDensity = min(100, (bugs / commits) * 100)
``` id="bug-formula"

---

### 🟡 Ownership Score

```text
if contributors == 1 → 100
if contributors <= 3 → 60
else → 20
``` id="ownership-formula"

---

### 🟢 Test Coverage Score

```text
if hasTests → 20
else → 100
``` id="test-formula"

---

---

## Step 2: Combine Scores

```text
Risk Score =
  volatility * 0.3 +
  bugDensity * 0.4 +
  ownership * 0.1 +
  testCoverage * 0.2
``` id="risk-formula"

---

## Step 3: Convert to Health Score

```text
Health Score = 100 - Risk Score
``` id="health-formula"

---

---

# 🧩 Repo-Level Health

---

## Approach

Weighted average of file scores:

```text
Repo Health =
  Σ(fileHealth × fileWeight) / Σ(weights)
``` id="repo-health-formula"

---

## File Weight Factors

- number of commits  
- business importance (optional boost)

---

---

# 🧠 Explanation Engine

---

## Purpose

Every score must be explainable.

---

## Generate Reasons

Example logic:

- High commits → "High commit activity"
- High bugs → "Frequent bug reports"
- No tests → "Lack of test coverage"

---

## Output Example

```json
"reasons": [
  "High commit activity",
  "Multiple bug reports",
  "No test coverage"
]
``` id="reason-output"

---

---

# ⚙️ Technical Implementation

---

## 🧩 Core Function

```ts
function calculateRisk(file) {
  const volatility = Math.min(100, file.recentCommits * 2);

  const bugDensity = Math.min(
    100,
    (file.bugs / file.commits) * 100
  );

  const ownership =
    file.contributors === 1
      ? 100
      : file.contributors <= 3
      ? 60
      : 20;

  const test = file.hasTests ? 20 : 100;

  const risk =
    volatility * 0.3 +
    bugDensity * 0.4 +
    ownership * 0.1 +
    test * 0.2;

  return {
    riskScore: Math.round(risk),
    healthScore: Math.round(100 - risk)
  };
}
``` id="risk-code"

---

---

# ⚡ Performance Strategy

---

## 1. Lightweight Computation

- No heavy processing  
- Pure functions  

---

## 2. Batch Processing

- Process all files in loop  

---

## 3. Parallel Execution

Optional:

```ts
files.map(file => calculateRisk(file))
``` id="parallel-risk"

---

---

# 🧪 Testing Strategy

---

## Unit Tests

Test each metric:

---

### Example

```ts
test("high commits increase volatility", () => {
  const result = calculateRisk({
    commits: 100,
    recentCommits: 50,
    bugs: 1,
    contributors: 5,
    hasTests: true
  });

  expect(result.riskScore).toBeGreaterThan(50);
});
``` id="risk-test"

---

---

# 🔐 Edge Cases

---

## Case 1: No Commits

```text
commits = 0 → bugDensity = 0
``` id="edge1"

---

## Case 2: Missing Data

- Default safe values  
- Avoid crashes  

---

## Case 3: Extremely High Values

- Always cap at 100  

---

---

# 🧠 Design Principles

---

## 1. Deterministic

Same input → same output

---

## 2. Explainable

Every score must have reason

---

## 3. Simple

No ML, only formulas

---

## 4. Fast

Runs in milliseconds

---

---

# ⚡ Optional Enhancements

---

- Confidence score  
- Historical comparison  
- Trend weighting  

---

---

# 🏁 Final Summary

---

> The Risk Scoring Agent transforms raw repository signals into clear, explainable risk metrics, forming the foundation for prediction and business impact analysis.

---