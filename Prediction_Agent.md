# 🔮 Prediction Agent (prediction_agent.md)

---

## 🎯 Purpose

The **Prediction Agent** estimates:

> 👉 “Which components are likely to fail in the next 90 days?”

It converts current risk + recent trends into **future failure probability**.

---

## 🧠 Core Idea

We DO NOT train ML models.

Instead:

> 👉 Use **trend-based heuristics + risk amplification**

This keeps the system:
- Explainable ✅
- Fast ✅
- Reliable ✅

---

## 🚀 Responsibilities

The Prediction Agent must:

1. Take risk-scored data  
2. Analyze recent trends  
3. Estimate failure probability  
4. Project risk into next 90 days  
5. Provide explanation  

---

## ❗ What It DOES NOT DO

- ❌ No business impact calculation  
- ❌ No LLM usage  
- ❌ No deep ML  

👉 Only **prediction logic**

---

# 📥 Input

From Risk Agent:

```json
{
  "files": [
    {
      "file": "payment.py",
      "riskScore": 87,
      "recentCommits": 40,
      "commits": 120,
      "bugs": 10
    }
  ]
}
``` id="prediction-input"

---

# 📤 Output

---

## Example

```json
{
  "files": [
    {
      "file": "payment.py",
      "failureProbability": 0.68,
      "riskTrend": "increasing",
      "predictedRisk": 92,
      "confidence": 0.82,
      "reasons": [
        "High current risk",
        "Increasing commit activity",
        "Rising bug frequency"
      ]
    }
  ]
}
``` id="prediction-output"

---

# 🧠 Prediction Model Design

---

## 🎯 Philosophy

Future risk depends on:

- Current risk  
- Change trends  
- Bug trends  

---

---

# 🔍 Step 1: Analyze Trends

---

## 🔹 Commit Trend

```text
commitTrend = recentCommits / totalCommits
``` id="commit-trend"

---

### Interpretation:

| Value | Meaning |
|------|--------|
| > 0.4 | High recent activity (unstable) |
| 0.2–0.4 | Moderate |
| < 0.2 | Stable |

---

---

## 🔹 Bug Trend

Simple approach:

```text
bugTrend = bugs / commits
``` id="bug-trend"

---

👉 Higher value → increasing instability

---

---

# 🧮 Step 2: Growth Factor

---

## Formula

```text
growthFactor =
  1 + (commitTrend * 0.5) + (bugTrend * 0.5)
``` id="growth-factor"

---

👉 Example:

- commitTrend = 0.4  
- bugTrend = 0.2  

→ growthFactor = 1 + 0.2 + 0.1 = 1.3  

---

---

# 🔮 Step 3: Future Risk Projection

---

## Formula

```text
predictedRisk = min(100, currentRisk * growthFactor)
``` id="future-risk"

---

---

# 🎯 Step 4: Failure Probability

---

## Simple Mapping

```text
failureProbability = predictedRisk / 100
``` id="failure-prob"

---

---

# 🧠 Step 5: Confidence Score

---

## Idea

Confidence depends on data quality:

```text
confidence =
  min(1,
    (commits / 100) * 0.5 +
    (bugs / 20) * 0.5
  )
``` id="confidence-formula"

---

👉 More data → higher confidence

---

---

# 🧩 Final Output Fields

---

| Field | Description |
|------|------------|
| predictedRisk | Future risk score |
| failureProbability | Likelihood of failure |
| riskTrend | increasing / stable / decreasing |
| confidence | trust level |
| reasons | explanation |

---

---

# ⚙️ Technical Implementation

---

## 🧩 Core Function

```ts
function predict(file) {
  const commitTrend = file.recentCommits / file.commits;

  const bugTrend = file.bugs / file.commits;

  const growthFactor =
    1 + commitTrend * 0.5 + bugTrend * 0.5;

  const predictedRisk = Math.min(
    100,
    file.riskScore * growthFactor
  );

  const failureProbability = predictedRisk / 100;

  const confidence = Math.min(
    1,
    (file.commits / 100) * 0.5 +
      (file.bugs / 20) * 0.5
  );

  return {
    predictedRisk: Math.round(predictedRisk),
    failureProbability: Number(failureProbability.toFixed(2)),
    confidence: Number(confidence.toFixed(2))
  };
}
``` id="prediction-code"

---

---

# 🧠 Trend Labeling

---

## Logic

```ts
if (growthFactor > 1.2) → "increasing"
if (growthFactor ~ 1) → "stable"
if (growthFactor < 0.9) → "decreasing"
``` id="trend-logic"

---

---

# 🧠 Explanation Engine

---

## Generate Reasons

Rules:

- High risk → "High current risk"
- High commitTrend → "Increasing activity"
- High bugTrend → "Rising bugs"

---

---

# ⚡ Performance Strategy

---

## 1. Lightweight Computation

- No external calls  
- Pure math  

---

## 2. Batch Processing

```ts
files.map(predict)
``` id="batch-predict"

---

---

# 🔐 Edge Cases

---

## Case 1: Zero Commits

```text
avoid division by zero
``` id="edge-zero"

---

## Case 2: Low Data

- Reduce confidence  

---

## Case 3: Extremely High Growth

- Cap at 100  

---

---

# 🧪 Testing Strategy

---

## Unit Test Example

```ts
test("high growth increases prediction", () => {
  const result = predict({
    riskScore: 80,
    commits: 100,
    recentCommits: 50,
    bugs: 10
  });

  expect(result.predictedRisk).toBeGreaterThan(80);
});
``` id="prediction-test"

---

---

# 🧠 Design Principles

---

## 1. Predict Trends, Not Exact Events

We estimate likelihood, not certainty

---

## 2. Keep It Explainable

Every prediction must have reason

---

## 3. Avoid Over-Engineering

Heuristics > ML

---

## 4. Fast Execution

Runs instantly

---

---

# ⚡ Optional Enhancements

---

- Time-series trend analysis  
- Historical comparisons  
- Decay factors  

---

---

# 🏁 Final Summary

---

> The Prediction Agent uses trend-based heuristics to forecast future risks and estimate failure probability over the next 90 days, enabling proactive decision-making.

---