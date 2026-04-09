# 🔗 Services Interaction & Data Flow (services_interaction.md)

---

## 🎯 Purpose

This document explains:

- How all agents (modules) interact  
- How data flows across the system  
- How services (GitHub, LLM, etc.) are used  
- How to keep everything **simple, modular, and maintainable**

---

## 🧠 Core Principle

> “Linear pipeline + shared services”

---

## ⚡ Key Idea

- Agents DO NOT talk to each other directly  
- Orchestrator controls everything  
- Services are reusable utilities  

---

---

# 🧩 SYSTEM COMPONENTS

---

## 🔹 Agents (Core Logic)

1. Repo Analysis Agent  
2. Risk Agent  
3. Prediction Agent  
4. Business Impact Agent  
5. Report Agent  

---

## 🔹 Services (External + Utilities)

- GitHub Service → fetch repo data  
- LLM Service → generate report  
- Cache Service → store results (optional)  

---

## 🔹 Orchestrator

- Controls flow  
- Connects agents  

---

---

# 🔁 HIGH-LEVEL FLOW

---


User → API → Orchestrator
↓
Repo Agent
↓
Risk Agent
↓
Prediction Agent
↓
Business Impact Agent
↓
Report Agent
↓
Response


---

---

# 📦 STEP-BY-STEP INTERACTION

---

## 🟦 Step 1: User Request

---

### API Call


POST /api/analyze-repo


---

### Input

- repo URL  

---

---

## 🟨 Step 2: Orchestrator Starts Flow

---

Orchestrator receives request:

```ts
orchestrate(repoUrl)
``` id="interaction-step2"

---

---

## 🟧 Step 3: Repo Analysis Agent

---

### Calls:

- GitHub Service  

---

### Flow:


Repo Agent → GitHub Service → GitHub API


---

### Output:

```json
{
  "files": [...],
  "summary": {...}
}
``` id="interaction-output1"

---

---

## 🟥 Step 4: Risk Agent

---

### Input:

- repo data  

---

### Output:

- risk scores  
- health score  

---

### Interaction:


Risk Agent ← Repo Agent output


---

---

## 🟩 Step 5: Prediction Agent

---

### Input:

- risk data  

---

### Output:

- failure probability  
- predicted risk  

---

### Interaction:


Prediction Agent ← Risk Agent output


---

---

## 🟪 Step 6: Business Impact Agent

---

### Input:

- prediction data  

---

### Output:

- expected loss  
- business impact  

---

### Interaction:


Impact Agent ← Prediction Agent output


---

---

## 🟫 Step 7: Report Agent

---

### Input:

- impact data  
- repo health  

---

### Calls:

- LLM Service  

---

### Flow:


Report Agent → LLM Service → LLM API


---

### Output:

- CEO report  

---

---

## 🟩 Step 8: Response to Frontend

---

Orchestrator returns:

```json
{
  "healthScore": 68,
  "risks": [...],
  "impact": {...},
  "report": {...}
}
``` id="interaction-final"

---

---

# 🔌 SERVICE INTERACTIONS

---

## 🟦 GitHub Service

---

### Used By:
- Repo Analysis Agent  

---

### Responsibility:

- Fetch commits  
- Fetch issues  
- Fetch contributors  

---

---

## 🟨 LLM Service

---

### Used By:
- Report Agent  

---

### Responsibility:

- Generate natural language report  

---

---

## 🟧 Cache Service (Optional)

---

### Used By:
- Orchestrator  
- Repo Agent  

---

### Responsibility:

- Store previous results  
- Reduce API calls  

---

---

# ⚙️ DATA FLOW STRUCTURE

---

## Sequential Flow


Repo Data
↓
Risk Data
↓
Prediction Data
↓
Impact Data
↓
Report


---

---

# 🧠 DATA CONTRACTS (IMPORTANT)

---

Each agent must return **clean structured data**:

---

## Rules:

- No raw API responses  
- No mixed formats  
- Always JSON  

---

---

# ⚡ ERROR HANDLING FLOW

---

## If any step fails:

---

### Strategy:

1. Log error  
2. Continue with available data  
3. Return partial response  

---

---

### Example


Prediction fails → still return risk + report


---

---

# ⚡ PERFORMANCE STRATEGY

---

## 1. Limit Data Early

- Repo Agent filters top files  

---

## 2. Parallel Execution (Optional)

```ts
await Promise.all([
  riskAgent(data),
  predictionAgent(data)
]);
``` id="parallel-interaction"

---

---

## 3. Caching

- Store repo analysis results  

---

---

# 🧪 DEBUGGING FLOW

---

## Each Agent Logs:

- Input  
- Output  

---

## Orchestrator Logs:

- Step start  
- Step end  

---

---

# 🏗️ FOLDER INTERACTION

---


/lib/orchestrator.ts

/modules
repoAgent.ts
riskAgent.ts
predictionAgent.ts
impactAgent.ts
reportAgent.ts

/services
githubService.ts
llmService.ts
cacheService.ts


---

---

# 🧠 DESIGN PRINCIPLES

---

## 1. Orchestrator Controls Everything

Agents never call each other  

---

## 2. Agents Are Pure

- No side effects  
- No external calls (except repo agent)  

---

## 3. Services Are Shared

Reusable across agents  

---

## 4. Linear Flow

Keep it simple  

---

---

# 🚀 FUTURE EXTENSION

---

- Add queue system  
- Async processing  
- Streaming updates  

---

---

# 🏁 FINAL SUMMARY

---

> The system follows a clean, orchestrator-driven pipeline where independent agents process data step-by-step, supported by shared services, ensuring simplicity, scalability, and maintainability.

---