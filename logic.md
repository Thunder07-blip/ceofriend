# 🧠 Core Logic & Mathematical Model (logic.md)
## Predictive Engineering Intelligence Platform

---

## 🎯 Purpose

This document defines the **complete deterministic logic and mathematical framework** used in the system.

> The goal is to convert software engineering signals into **quantifiable business risk (₹)** using explainable, structured equations.

---

## 🧠 Philosophy

We model the system as:

> **A probabilistic financial risk engine driven by engineering signals**

---

## ⚡ Core Flow


Repository Data
↓
Risk Scoring
↓
Prediction (90-day horizon)
↓
Business Mapping
↓
Financial Impact (₹)


---

# 📥 1. INPUT VARIABLES (KNOWN)

---

## 🔹 1.1 Technical Inputs (From Repo)

For each file \( i \):

| Variable | Description |
|--------|------------|
| \( C_i \) | Total commits |
| \( C_{recent,i} \) | Commits in last 30 days |
| \( B_i \) | Bug count |
| \( U_i \) | Unique contributors |
| \( T_i \) | Test presence (1/0) |
| \( N_i \) | File path/name |

---

---

## 🔹 1.2 Business Inputs (From CEO)

Minimal required inputs:

| Variable | Description |
|--------|------------|
| \( R_a \) | Annual revenue (₹) |
| \( I \) | Industry type |
| \( K \) | Critical systems |

---

---

# 🧮 2. RISK MODEL (DETERMINISTIC)

---

## 🔴 2.1 Volatility Risk

\[
V_{vol} = \min(100, C_{recent} \times 2)
\]

---

## 🟠 2.2 Bug Density Risk

\[
V_{bug} = \min(100, \frac{B}{C} \times 100)
\]

---

## 🟡 2.3 Ownership Risk

\[
V_{own} =
\begin{cases}
100 & U \le 1 \\
60 & U \le 3 \\
30 & U \le 5 \\
20 & U > 5
\end{cases}
\]

---

## 🟢 2.4 Test Coverage Risk

\[
V_{test} =
\begin{cases}
20 & T = 1 \\
100 & T = 0
\end{cases}
\]

---

---

## ⚙️ 2.5 Combined Risk Score

\[
R_{score} =
0.3 V_{vol} +
0.4 V_{bug} +
0.1 V_{own} +
0.2 V_{test}
\]

---

---

# 🔮 3. PREDICTION MODEL (90 DAYS)

---

## 🔹 3.1 Commit Trend

\[
T_{commit} = \frac{C_{recent}}{C}
\]

---

## 🔹 3.2 Bug Trend

\[
T_{bug} = \frac{B}{C}
\]

---

## 🔹 3.3 Growth Factor

\[
\gamma = 1 + (0.5 \cdot T_{commit}) + (0.5 \cdot T_{bug})
\]

---

## 🔹 3.4 Predicted Risk

\[
R_{pred} = \min(100, R_{score} \cdot \gamma)
\]

---

## 🔹 3.5 Failure Probability

\[
P_{fail} = \frac{R_{pred}}{100}
\]

---

---

# 🔁 4. FAILURE FREQUENCY MODEL (NEW)

---

## 🎯 Purpose

Estimate how often failures may occur.

---

## 🔹 Formula

\[
F_{exp} = 1 + \frac{R_{pred}}{50}
\]

---

### Interpretation:

| Risk | Frequency |
|------|----------|
| 50 | ~2 failures |
| 80 | ~2.6 failures |
| 100 | ~3 failures |

---

---

# 🧠 5. BUSINESS IMPACT MODEL

---

## 🔹 5.1 Base Hourly Cost

Derived from system type:

| System | \( H_{base} \) |
|------|--------------|
| payment | ₹200,000 |
| auth | ₹50,000 |
| search | ₹30,000 |

---

---

## 🔹 5.2 Revenue Scaling

\[
M_{rev} =
\min\left(10, \max\left(0.1, \frac{R_a}{10,000,000}\right)\right)
\]

---

---

## 🔹 5.3 Industry Multiplier

\[
M_{ind} = \text{constant based on industry}
\]

---

---

## 🔹 5.4 Critical System Multiplier

\[
M_{crit} =
\begin{cases}
1.5 & N_i \in K \\
1.0 & \text{otherwise}
\end{cases}
\]

---

---

## 🔹 5.5 Final Hourly Cost

\[
C_{hour} = H_{base} \times (M_{rev} \cdot M_{ind} \cdot M_{crit})
\]

---

---

# 👥 6. USER IMPACT FACTOR (NEW)

---

## 🎯 Purpose

Measure % of business affected

---

## 🔹 Values

| System | \( U_{impact} \) |
|------|----------------|
| payment | 0.9 |
| auth | 0.7 |
| search | 0.5 |
| analytics | 0.3 |

---

---

# ⏳ 7. EXPECTED DOWNTIME

---

\[
T_{down} =
\begin{cases}
3 & R_{pred} \ge 80 \\
2 & R_{pred} \ge 50 \\
1 & R_{pred} < 50
\end{cases}
\]

---

---

# 💸 8. FINAL FINANCIAL MODEL

---

## 🔥 FINAL EQUATION

\[
E_{loss} =
P_{fail} \cdot C_{hour} \cdot T_{down} \cdot U_{impact} \cdot F_{exp}
\]

---

---

## 🧠 Interpretation

Expected loss depends on:

- Probability of failure  
- Cost per hour  
- Downtime duration  
- User impact  
- Failure frequency  

---

---

# 🧩 9. OUTPUT VARIABLES (DEDUCED)

---

## Per Component

- \( R_{score} \)
- \( R_{pred} \)
- \( P_{fail} \)
- \( F_{exp} \)
- \( C_{hour} \)
- \( E_{loss} \)

---

## Repo Level

\[
E_{total} = \sum E_{loss,i}
\]

---

---

# 🧠 10. EXPLAINABILITY FRAMEWORK

---

## Layer 1: Mathematical

- All formulas deterministic  

---

## Layer 2: Reason-Based

Example:

- High commits → instability  
- Bugs → reliability issues  

---

## Layer 3: Business Mapping

- payment → revenue  
- auth → user access  

---

## Layer 4: LLM Explanation

- Converts structured data → narrative  

---

---

# ⚡ 11. DESIGN PRINCIPLES

---

## ✅ Deterministic
No black-box ML

---

## ✅ Explainable
Every number traceable

---

## ✅ Scalable
Works across industries

---

## ✅ Minimal Inputs
Only essential CEO data

---

---

# 🚀 12. OPTIONAL EXTENSIONS

---

## 🔹 Recovery Efficiency

\[
T_{down} = \frac{T_{base}}{R_{eff}}
\]

---

## 🔹 Deployment Risk Factor

Higher deploy frequency → higher instability

---

---

# 🏁 FINAL SUMMARY

---

> This system models software instability as a probabilistic financial risk using deterministic equations, enabling accurate, explainable, and actionable insights for business decision-makers.

---

## ⚡ One-Line Summary

> “We convert engineering signals into expected financial loss using a deterministic, explainable probabilistic model.”

---