# 🧠 CEOfriend Risk Engine v2 (logic_fix.md)
## Advanced Scoring Theory, Failures & Fixes

---

# 🎯 PURPOSE

This document defines the improved risk scoring system for CEOfriend.

Goal:
- Handle large repositories
- Handle small/outlier repos
- Avoid score collapse (always 100)
- Provide stable, explainable results

---

# ❌ 1. PROBLEMS IN OLD SYSTEM

## 1.1 Raw Metrics Problem
Old system used raw commits, bugs, contributors → caused explosion in values.

## 1.2 No Normalization
Different repo sizes treated equally → incorrect scoring.

## 1.3 No Sampling
Analyzing too many or random files → noisy results.

## 1.4 No Saturation
Linear growth → scores hit 100 too easily.

## 1.5 No Outlier Handling
Small repos look risky, large repos always max risk.

---

# 🚀 2. NEW PIPELINE

Fetch Repo  
→ Select Important Files  
→ Normalize Metrics  
→ Apply Risk Model  
→ Apply Saturation  
→ Adjust for Size  
→ Handle Outliers  
→ Compute Final Risk  
→ Add Confidence  

---

# 🔥 3. FIXES

## FIX 1: NORMALIZATION

V_vol = (recent_commits / total_commits) * 100  
V_bug = (bugs / max(1, commits)) * 100  

---

## FIX 2: FILE SAMPLING

Select Top 20–50 files based on:
score = bug + churn + priority

---

## FIX 3: SATURATION

R_squashed = 100 * (1 - exp(-R / 50))

---

## FIX 4: SIZE NORMALIZATION

repo_size_factor = log(total_files + 1)  
R = R / repo_size_factor  

---

## FIX 5: OUTLIERS

Small repo:
risk *= 0.7  

No data:
risk = 30–50  

---

## FIX 6: TURNOVER NORMALIZATION

M_rev = clamp(revenue / baseline, 0.3, 3.0)

---

## FIX 7: CONFIDENCE

confidence = available_data / expected_data  

---

## FIX 8: HYBRID MODEL

Rules → scoring  
LLM → explanation  

---

# 🧠 FINAL

Health = 100 - R  

---

# 🏁 SUMMARY

Old: raw + unstable  
New: normalized + scalable + explainable  
