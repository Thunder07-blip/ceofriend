# ⚙️ Tech Stack (tech_stack.md)
## Predictive Engineering Intelligence Platform

---

## 🎯 Philosophy

This tech stack is designed for:

- ⚡ Maximum development speed
- 🧠 Minimal complexity
- 🎯 Focus on core intelligence (not infrastructure)
- 🚀 Hackathon efficiency

---

# 🧱 FINAL TECH STACK (NO DATABASE, NO REDIS)

---

## 🟦 Frontend + Backend

### Next.js (App Router)

- Full-stack framework
- Handles:
  - Frontend UI (React)
  - Backend APIs (REST)
- Single codebase → faster development

---

## 🟨 Language

### TypeScript

- Strong typing
- Better debugging
- Cleaner code structure

---

## 🟧 Styling

### Tailwind CSS

- Rapid UI development
- No need for custom CSS setup

---

## 🟥 UI Components

### shadcn/ui

- Clean, modern components
- Ready-to-use cards, buttons, dialogs

---

## 🟩 Charts

### Recharts

- Simple and effective data visualization
- Used for risk and impact charts

---

## 🟪 Icons

### Lucide React

- Lightweight, modern icons

---

## 🧠 AI / LLM

### Groq API (LLaMA / Mixtral)

- Free tier
- Very fast inference
- Used ONLY for:
  - CEO report generation
  - Explanation layer

---

## 🔌 External Integration

### GitHub REST API

- Fetch:
  - commits
  - issues
  - contributors

---

## 🟫 Backend Architecture

### Modular Monolith (inside Next.js)

- Agents implemented as modules
- Orchestrator controls flow
- No microservices

---

## 🧩 Orchestration

### Custom Orchestrator (TypeScript)

- Simple function-based pipeline
- No heavy frameworks

---

## ⚡ State Handling

### In-Memory Processing (No DB)

- Data flows through pipeline
- No persistence required

---

## ⚡ Lightweight Caching (Optional)

### JavaScript Map

```ts
const cache = new Map();
Avoid repeated API calls (optional)
No Redis required
📄 PDF Generation
Puppeteer
Convert report HTML → PDF
Professional CEO report output
🧪 Testing
Jest
Unit testing for agents
Ensures reliability
🚀 Deployment
Vercel
Native support for Next.js
One-click deployment
Fast and reliable
🧠 WHY THIS STACK?
✅ Simplicity
One framework (Next.js)
No database setup
No caching infrastructure
✅ Speed
Build entire system quickly
Minimal configuration
✅ Focus
Concentrate on:
risk logic
prediction
business impact
✅ Reliability
Deterministic logic
No infra-related failures
✅ Future Ready

Easily extendable:

Add PostgreSQL later
Add Redis if scaling
Add background jobs
🏁 FINAL STACK OVERVIEW
Layer	Tech
Frontend	Next.js + Tailwind
Backend	Next.js API
Language	TypeScript
AI	Groq
Charts	Recharts
PDF	Puppeteer
Testing	Jest
Deployment	Vercel