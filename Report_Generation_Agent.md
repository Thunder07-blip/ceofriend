# 📄 Report Generation Agent (report_agent.md)

---

## 🎯 Purpose

The **Report Generation Agent** converts structured analysis into a **CEO-friendly business report**.

> It answers:
👉 “What is happening, why it matters, and what should be done?”

---

## 🧠 Core Idea

All previous agents produce **data**.

This agent produces:

> 👉 **Decision Intelligence**

---

### 🔁 Transformation


Risk + Prediction + Impact → Clear Business Narrative


---

## 🚀 Responsibilities

The Report Agent must:

1. Take structured outputs from all agents  
2. Generate:
   - Executive summary  
   - Key risks  
   - Financial impact  
   - Cost of inaction  
   - Recommendations  
3. Convert technical insights → business language  
4. Output:
   - Structured JSON  
   - Human-readable report  
   - PDF-ready content  

---

## ❗ What It DOES NOT DO

- ❌ No risk calculation  
- ❌ No prediction  
- ❌ No raw data processing  

👉 Only **presentation + explanation**

---

# 📥 Input

Combined data:

```json
{
  "repoHealth": 68,
  "files": [
    {
      "file": "payment.py",
      "predictedRisk": 92,
      "failureProbability": 0.68,
      "expectedLoss": 408000,
      "businessFunction": "Revenue Generation"
    }
  ],
  "totalRiskExposure": 800000
}
``` id="report-input"

---

# 📤 Output

---

## 🧾 Structured Output

```json
{
  "summary": "...",
  "keyRisks": [],
  "financialImpact": "...",
  "recommendations": []
}
``` id="report-output"

---

---

# 🧠 Report Structure (VERY IMPORTANT)

---

## 🟥 1. Executive Summary

---

### Goal

Explain everything in **3–4 lines**

---

### Example

> “The system is currently at elevated risk, with critical vulnerabilities in the payment module. If unaddressed, this could result in estimated losses of ₹6–10 lakhs over the next 90 days due to transaction failures and system instability.”

---

---

## 🟧 2. Key Risks

---

### Format

For each high-risk component:

- Component name  
- Risk level  
- Business impact  

---

### Example

**Payment System**
- Risk Level: High  
- Impact: Direct revenue loss  

---

---

## 🟨 3. Financial Impact

---

### Goal

Quantify the problem

---

### Example

> “The total projected financial exposure is approximately ₹8,00,000, primarily driven by potential failures in revenue-critical systems.”

---

---

## 🟩 4. Cost of Inaction (🔥 KEY DIFFERENTIATOR)

---

### Goal

Create urgency

---

### Example

> “Delaying action may lead to repeated service disruptions, loss of customer trust, and compounding financial losses over time.”

---

---

## 🟦 5. Recommendations

---

### Goal

Make it actionable

---

### Example

1. Prioritize stabilization of payment module  
2. Improve test coverage in critical components  
3. Monitor high-change areas closely  

---

---

# 🤖 LLM Integration

---

## 🎯 Role of LLM

- Convert structured data → natural language  
- Ensure clarity and tone  

---

## ⚡ Important Rule

👉 LLM is ONLY used for:
- explanation  
- summarization  

👉 NOT for:
- calculations  
- logic  

---

---

## 🧩 Prompt Template

---

```text
You are a business consultant explaining technical risks to a CEO.

Your goal:
- Explain risks in simple business language
- Focus on money, users, and impact
- Avoid technical jargon

Input Data:
{data}

Generate:
1. Executive summary
2. Key risks
3. Financial impact
4. Cost of inaction
5. Recommendations

Tone:
- Clear
- Confident
- Advisory
``` id="llm-prompt"

---

---

# ⚙️ Technical Implementation

---

## 🧩 Core Function

```ts
async function generateReport(data) {
  const prompt = buildPrompt(data);

  const response = await llmService(prompt);

  return formatReport(response);
}
``` id="report-code"

---

---

# 🧠 Preprocessing Before LLM

---

## Important Step

Clean and structure input:

- Sort by highest loss  
- Select top 3 risks  
- Aggregate totals  

---

---

# 📄 PDF Generation

---

## Flow


Report JSON → HTML Template → Puppeteer → PDF


---

---

# 🎨 Formatting Strategy

---

## Principles

- Short paragraphs  
- Bold key numbers  
- Bullet points  
- Clear sections  

---

---

# 🧠 Tone Guidelines

---

## MUST BE:

- Non-technical  
- Business-focused  
- Actionable  

---

## MUST NOT BE:

- Code-heavy  
- Jargon-heavy  
- Overly verbose  

---

---

# 🧪 Testing Strategy

---

## Test Cases

- Handles high-risk input  
- Handles low-risk input  
- Handles missing data  

---

---

# 🔐 Edge Cases

---

## Case 1: No High Risk

- Generate “System is stable” report  

---

## Case 2: Missing Data

- Use fallback statements  

---

## Case 3: Low Confidence

- Mention uncertainty  

---

---

# 🧠 Design Principles

---

## 1. Business First

Always prioritize impact

---

## 2. Clarity Over Detail

Simple > complex

---

## 3. Actionable Output

Must guide decisions

---

## 4. Trustworthy Tone

No exaggeration

---

---

# 🔥 Key Innovation

---

## “CEO-Readable AI Report”

Unlike traditional tools:

- No dashboards only  
- No raw metrics  

👉 Full **decision narrative**

---

---

# 🏁 Final Summary

---

> The Report Agent transforms technical analysis into a clear, structured business narrative, enabling non-technical stakeholders to understand risks and take informed action.

---