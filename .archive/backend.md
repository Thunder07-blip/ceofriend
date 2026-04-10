# ⚙️ Backend Design Document (backend.md)
## Predictive Engineering Intelligence Platform

---

## 🧠 Backend Philosophy

The backend is designed as a **modular monolith with RESTful APIs**, acting as the brain of the system.

> It orchestrates data extraction, risk analysis, prediction, business mapping, and report generation — all in a **deterministic, explainable, and scalable manner**.

---

## 🎯 Backend Goals

- Provide **fast and reliable analysis**
- Maintain **modular separation (agent-based design)**
- Ensure **deterministic outputs (no black-box logic)**
- Enable **easy debugging and testing**
- Support **future scalability**

---

# ⚙️ Tech Stack (Detailed)

---

## 🟦 Core Framework

### Next.js (App Router)

- Acts as:
  - Backend API server
  - Frontend framework

👉 Why:
- Single codebase
- Easy deployment
- Built-in API routes

---

## 🟨 Language

### TypeScript

- Strong typing
- Better maintainability
- Prevents runtime errors

---

## 🟧 API Architecture

### RESTful API Design

- Stateless communication
- Clear resource-based endpoints
- JSON-based responses

---

## 🟥 AI Layer

### LLM Providers

- Groq (LLaMA / Mixtral)
- Cohere (optional backup)

---

## 🟩 External Integrations

- GitHub REST API
- (Optional) GitLab API

---




---

## 📄 PDF Generation

- Puppeteer (HTML → PDF)

---

# 🧱 Backend Architecture Overview

---


Client (Frontend)
↓
REST API (Next.js)
↓
Orchestrator Layer
↓
Domain Modules (Agents)
↓
Service Layer (GitHub, LLM, Cache)
↓
Database / External APIs


---

# 🧩 REST API DESIGN

---

## 🔹 Base URL


/api


---

## 🔹 Endpoints Overview

| Method | Endpoint | Description |
|-------|--------|-------------|
| POST | /analyze-repo | Start analysis |
| GET | /repo/:id | Get repo summary |
| GET | /repo/:id/components | Get components |
| GET | /component/:id | Get component details |
| GET | /report/:id | Get CEO report |
| GET | /report/:id/pdf | Download PDF |

---

---

# 🔁 API FLOW (CORE PIPELINE)

---

## 🟦 1. Start Analysis

### Endpoint

POST /api/analyze-repo


---

### Request Body

```json
{
  "repoUrl": "https://github.com/user/repo"
}
``` id="req-body"

---

### Response

```json
{
  "analysisId": "abc123",
  "status": "processing"
}
``` id="res-body"

---

---

## 🟨 2. Get Repo Summary


GET /api/repo/:id


---

### Response

```json
{
  "healthScore": 72,
  "riskLevel": "HIGH",
  "potentialLoss": "₹6-10L"
}
``` id="repo-response"

---

---

## 🟧 3. Get Components


GET /api/repo/:id/components


---

### Response

```json
[
  {
    "file": "payment.py",
    "risk": 87,
    "impact": "₹6L"
  }
]
``` id="components-response"

---

---

## 🟥 4. Component Details


GET /api/component/:id


---

---

## 🟩 5. CEO Report


GET /api/report/:id


---

---

## 🟪 6. Download PDF


GET /api/report/:id/pdf


---

---

# 🧠 Orchestrator Layer

---

## 🎯 Role

Controls the full pipeline:


Repo Analysis → Risk → Prediction → Business Impact → Report


---

## 🧩 Example

```ts
export async function analyzeRepo(repoUrl: string) {
  const repoData = await repoAnalysis(repoUrl);
  const risk = riskEngine(repoData);
  const prediction = predictionEngine(risk);
  const impact = businessImpact(prediction);
  const report = await reportingAgent(impact);

  return { risk, prediction, report };
}
``` id="orchestrator-code"

---

---

# 🧩 Domain Modules (Agents)

---

## 🔹 1. Repo Analysis Module

### Responsibility
- Fetch repo data
- Extract:
  - commits
  - issues
  - contributors

---

## 🔹 2. Risk Engine

### Responsibility
- Calculate:
  - volatility
  - bug density
  - ownership risk
  - test confidence

---

## 🔹 3. Prediction Engine

### Responsibility
- Forecast:
  - failure probability
  - 90-day trends

---

## 🔹 4. Business Impact Module

### Responsibility
- Map:
  - technical risk → financial loss

---

## 🔹 5. Reporting Module

### Responsibility
- Generate:
  - CEO-friendly report
  - explanations

---

---

# 🔌 Service Layer

---

## 🟦 GitHub Service

Handles:
- commits API
- issues API
- contributors API

---

## 🟨 LLM Service

Handles:
- report generation
- explanations
- suggestions

---

## 🟧 Cache Service

Handles:
- storing intermediate results
- avoiding recomputation

---

---

# 🔄 Data Flow (Detailed)

---

## Step-by-step:

1. User submits repo  
2. API triggers orchestrator  
3. Repo module fetches data  
4. Risk engine computes scores  
5. Prediction engine forecasts  
6. Business module calculates loss  
7. Reporting module generates summary  
8. Data stored and returned  

---

---

# ⚡ Performance Strategy

---

## 1. Selective Processing

- Only top 20 files
- Hotspot analysis

---

## 2. Caching

- Store previous results
- Reuse if repo unchanged

---

## 3. Parallel Execution

```ts
await Promise.all([
  riskEngine(data),
  predictionEngine(data)
]);
``` id="parallel-code"

---

---

# 🔐 Error Handling

---

## Standard Response Format

```json
{
  "success": false,
  "error": "GitHub API rate limit exceeded"
}
``` id="error-format"

---

## Strategies

- Retry logic for APIs  
- Graceful fallbacks  
- Partial results if failure  

---

---

# 🧪 Testing Strategy

---

## 🟢 Unit Tests

- Each module tested independently  

---

## 🟡 Integration Tests

- Module interactions  

---

## 🔴 API Tests

- Endpoint validation  

---

---

# 🔒 Security Considerations

---

- Validate repo URLs  
- Rate limit API calls  
- Sanitize inputs  
- Avoid exposing API keys  

---

---

# 📄 PDF Generation Flow

---


Report Data → HTML Template → Puppeteer → PDF


---

---

# 🚀 Scalability Plan

---

## Current
- Modular monolith  

---

## Future
- Extract services:
  - risk engine
  - reporting  

---

## Add:
- queue system (BullMQ)  
- background workers  

---

---

# 🏁 Final Principles

---

## 1. Deterministic Core Logic
No randomness in scoring.

---

## 2. LLM Only for Explanation
Never for critical calculations.

---

## 3. Modular Boundaries
Strict separation of concerns.

---

## 4. Fast Feedback
Return partial results early.

---

---

# ⚡ One-Line Summary

> “A RESTful, modular backend that transforms repository data into predictive business intelligence.”

---