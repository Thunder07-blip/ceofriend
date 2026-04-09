# 🎨 Frontend Design Document (frontend.md)
## Predictive Engineering Intelligence Platform

---

## 🧠 Frontend Philosophy

This platform is NOT for developers — it is for **decision-makers (CEOs, founders, product heads)**.

👉 Therefore the UI must:

- Focus on **business impact, not code**
- Highlight **money, risk, and decisions**
- Be **minimal, fast, and visually powerful**
- Feel like a **premium intelligence dashboard**

---

## ⚙️ Tech Stack

### Framework
- Next.js (App Router)

### Styling
- Tailwind CSS

### UI Components
- shadcn/ui (cards, buttons, dialogs)

### Charts
- Recharts

### Icons
- Lucide React

### State Management
- React hooks (useState, useEffect)
- Optional: Zustand (if needed)

---

## 🧱 Frontend Architecture

/app
/page.tsx → Landing page
/dashboard → Main dashboard
/analysis → Live scanning UI
/repo/[id] → Repo overview
/component/[id] → Component deep dive
/report → CEO report view

/components
/ui → reusable UI components
/cards → metric cards
/charts → visualizations
/layout → navbar, sidebar

/lib
/api → API calls
/types → types


---

# 📄 PAGES OVERVIEW

---

## 🟦 1. Landing Page (`/`)

### 🎯 Goal
Convince user in 5 seconds:
👉 “This helps me prevent financial loss”

---

### UI Sections

#### 🔹 Hero Section

- Heading:
  > “Predict Software Failures Before They Cost You Money”

- Subtext:
  > “AI-powered engineering intelligence for business leaders”

- CTA:
  - “Analyze Repository”

---

#### 🔹 Features Section

- Predict failures  
- Estimate financial risk  
- CEO-ready reports  

---

#### 🔹 Demo Preview

- Show:
  - Health score card
  - Risk heatmap
  - ₹ loss visualization

---

### 🎨 UX Tips
- Clean white/dark theme
- Big typography
- Minimal scrolling

---

## 🟨 2. Analysis Page (`/analysis`)

### 🎯 Goal
Make scanning feel **alive and intelligent**

---

### 🧠 Concept
👉 “AI is actively analyzing your system”

---

### UI Elements

#### 🔹 Live Status Feed

Example:


Analyzing repository structure...
Identifying high-risk components...
Payment module flagged ⚠️
Calculating financial exposure...


---

#### 🔹 Progress Indicators

- Files analyzed: 12 / 50  
- High-risk components: 3  
- Estimated loss: ₹4.2L  

---

#### 🔹 Animated Components

- Progress bar  
- Pulsing indicators  
- Typing animation (LLM thinking feel)

---

### 🎯 UX Principle

❌ Don’t show loader  
✅ Show “thinking system”

---

## 🟥 3. Dashboard (`/dashboard`)

### 🎯 Goal
Give instant high-level understanding

---

### 🧩 Layout

#### 🔹 Top Metrics Row

| Metric | Description |
|------|------------|
| Health Score | 72 / 100 |
| Risk Level | 🔴 High |
| Potential Loss | ₹6–10 Lakhs |

---

#### 🔹 Visual Style

- Large cards
- Bold numbers
- Color-coded:
  - Red = danger
  - Yellow = warning
  - Green = safe

---

### 🔹 Risk Distribution Chart

- Pie or bar chart:
  - High risk
  - Medium
  - Low

---

### 🔹 Key Insight Panel

Example:

> “Payment system contributes to 78% of total risk”

---

---

## 🟩 4. Repository Overview (`/repo/[id]`)

### 🎯 Goal
Show **where problems are**

---

### 🔹 Risk Heatmap

- Files as blocks
- Color intensity = risk

---

### 🔹 Component Table

| File | Risk | Impact |
|------|------|--------|
| payment.py | 🔴 87 | ₹6L |
| auth.js | 🟠 72 | churn |

---

### 🔹 Filters

- High risk only
- Business critical only

---

---

## 🟪 5. Component Deep Dive (`/component/[id]`)

### 🎯 Goal
Explain **WHY this is risky**

---

### 🔹 Section 1: Summary

- Risk Score
- Failure Probability
- Business Impact

---

### 🔹 Section 2: Technical Signals

- Commit frequency
- Bug count
- Contributors

---

### 🔹 Section 3: Business Translation

> “This component handles payment transactions. Failure could result in ₹2L/hour loss.”

---

### 🔹 Section 4: Recommendations

- Add test coverage  
- Refactor module  
- Monitor changes  

---

---

## 🟧 6. CEO Report Page (`/report`)

### 🎯 Goal
This is your **most important page**

---

### 🧠 Principle

👉 No technical jargon. Only business.

---

### 🔹 Layout

#### 🟥 Executive Summary

Big bold text:

> “Your system is at high risk of failure, with potential losses of ₹6–10 Lakhs in the next 90 days.”

---

#### 🟧 Key Risks

- Payment system → revenue loss  
- Auth system → user churn  

---

#### 🟨 Financial Exposure

| Area | Loss |
|------|------|
| Payments | ₹6L |
| Auth | churn |

---

#### 🟩 Cost of Inaction

> “Delaying fixes may result in repeated outages and declining customer trust.”

---

#### 🟦 Recommendations

1. Fix payment module  
2. Improve test coverage  
3. Monitor high-risk areas  

---

### 🔹 PDF Download Button

- “Download Full Report”

---

---

# 🎨 DESIGN SYSTEM

---

## 🎯 Color System

- 🔴 Red → Risk
- 🟡 Yellow → Warning
- 🟢 Green → Safe
- ⚫ Dark background → Premium feel

---

## 🔤 Typography

- Large headings
- Minimal paragraphs
- Focus on numbers

---

## 🧩 Components

- Metric cards
- Charts
- Tables
- Status badges

---

---

# ⚡ UX PRINCIPLES (VERY IMPORTANT)

---

## 1. Show Money First

Always prioritize:
👉 ₹ impact > technical details

---

## 2. Progressive Disclosure

- First: summary  
- Then: details  

---

## 3. Visual Hierarchy

- Big numbers → attention  
- Colors → urgency  

---

## 4. Real-Time Feel

- Live updates  
- Animated transitions  

---

## 5. Trust Building

- Show:
  - “Why this is risky”
  - Confidence score  

---

---

# 🚀 MICRO-INTERACTIONS

---

- Numbers counting up (₹0 → ₹6L)  
- Risk blinking  
- Smooth transitions  
- Hover tooltips  

---

---

# 📱 RESPONSIVENESS

- Desktop-first (CEO usage)
- Tablet support
- Mobile optional (basic)

---

---

# 🏁 FINAL EXPERIENCE

User journey:

1. Land on page  
2. Enter repo  
3. See live analysis  
4. Get instant risk insight  
5. View financial impact  
6. Download report  

---

---

# ⚡ ONE LINE UX GOAL

> “Make the CEO feel like they are looking at the financial future of their software.”

---