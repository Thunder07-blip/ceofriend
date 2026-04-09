# 📦 Repo Analysis Agent (repo_analysis.md)

---

## 🎯 Purpose

The **Repo Analysis Agent** is the **entry point of the entire system**.

> It converts a raw repository (GitHub/GitLab) into **structured, meaningful data** that other agents can use.

---

## 🧠 Core Idea

Instead of analyzing the entire codebase deeply, we:

> 👉 Extract **high-impact signals** from repository metadata

This keeps the system:
- Fast ⚡
- Scalable 📈
- Hackathon-friendly 🏆

---

## 🚀 Responsibilities

The Repo Analysis Agent must:

1. Connect to a repository  
2. Extract key engineering signals  
3. Identify important files (hotspots)  
4. Return clean, structured data  

---

## ❗ What It DOES NOT DO

- ❌ No risk calculation  
- ❌ No prediction  
- ❌ No business logic  
- ❌ No LLM usage  

👉 Only **data extraction + preprocessing**

---

# 📊 What Data We Extract

---

## 🔹 1. Commit Data

Purpose: Measure **change activity (volatility)**

Extract:
- Total commits (last 30 days)
- Commits per file
- Recent commit spikes

---

## 🔹 2. Issue Data (Bug Signals)

Purpose: Measure **reliability**

Extract:
- Issues labeled as "bug"
- Issues per file (if possible)
- Open vs closed bugs

---

## 🔹 3. Contributors Data

Purpose: Measure **ownership risk**

Extract:
- Number of contributors per file
- Top contributors
- Contribution distribution

---

## 🔹 4. File Hotspots (MOST IMPORTANT)

Purpose: Focus only on important parts

Identify:
- Most changed files
- Files with most bugs
- Critical directories (auth, payment, core)

---

👉 Only top **20–30 files** will be analyzed

---

## 🔹 5. Test Presence (Proxy)

Purpose: Estimate **confidence level**

Check:
- Presence of test files (`test/`, `__tests__`)
- Test-related commits

---

# 🧠 Output Structure

---

## 📦 Final Output (Example)

```json
{
  "repo": "example/repo",
  "files": [
    {
      "file": "payment.py",
      "commits": 120,
      "recentCommits": 40,
      "bugs": 10,
      "contributors": 3,
      "hasTests": false
    }
  ],
  "summary": {
    "totalCommits": 500,
    "totalBugs": 50,
    "contributors": 10
  }
}
``` id="repo-output"

---

👉 This output is passed to the **Risk Agent**

---

# ⚙️ Technical Implementation

---

## 🔌 1. GitHub API Integration

Use GitHub REST API:

---

### Key APIs

#### 📌 Get Commits

GET /repos/{owner}/{repo}/commits


---

#### 📌 Get Issues

GET /repos/{owner}/{repo}/issues


---

#### 📌 Get Contributors

GET /repos/{owner}/{repo}/contributors


---

#### 📌 Get Repo Files

GET /repos/{owner}/{repo}/contents


---

---

## ⚡ 2. Hotspot Detection Logic

---

### Step 1: Rank files by commits


Top 20 files with highest commits


---

### Step 2: Add bug-heavy files


Files with highest bug count


---

### Step 3: Add critical paths


/payment
/auth
/core


---

👉 Merge all → final file list

---

---

## 🧩 3. Data Processing Pipeline

---


Fetch commits
↓
Group by file
↓
Fetch issues
↓
Map issues → files
↓
Fetch contributors
↓
Combine all data


---

---

## ⚡ 4. Performance Strategy

---

### 🔹 Limit Scope

- Max 20–30 files  
- Last 30–60 days only  

---

### 🔹 Parallel API Calls

```ts
await Promise.all([
  fetchCommits(),
  fetchIssues(),
  fetchContributors()
]);
``` id="parallel-calls"

---

---

## 🧠 5. Handling Large Repos

---

### Problem:
Large repos = slow + API limits

---

### Solution:

---

#### ✅ 1. Time Window Restriction

Only fetch:

last 30 days data


---

#### ✅ 2. File Filtering

Ignore:
- static files
- assets
- configs

---

#### ✅ 3. Early Stop

Stop once:

Top 20 files identified


---

#### ✅ 4. Pagination Handling

Handle GitHub API pagination properly

---

---

## 🔐 Error Handling

---

### Cases:

- API rate limit exceeded  
- Repo not found  
- Private repo  

---

### Strategy:

- Retry with delay  
- Return partial data  
- Show meaningful error  

---

---

# 🧪 Testing Strategy

---

## Unit Tests

Test:
- commit extraction  
- hotspot detection  
- data merging  

---

## Example

```ts
test("detects top commit files", () => {
  const result = detectHotspots(mockData);
  expect(result.length).toBeLessThanOrEqual(20);
});
``` id="test-example"

---

---

# 🧠 Design Principles

---

## 1. Keep It Lightweight

No deep code parsing

---

## 2. Focus on Signals, Not Code

Metadata > code analysis

---

## 3. Deterministic Output

Same input → same output

---

## 4. Clean Data Contracts

Structured JSON output

---

---

# ⚡ Optimization Ideas (Optional)

---

- Cache repo results  
- Store previous scans  
- Incremental updates  

---

---

# 🏁 Final Summary

---

> The Repo Analysis Agent extracts high-impact engineering signals from a repository and transforms them into structured data, enabling fast and scalable downstream analysis.

---