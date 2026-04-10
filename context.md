# CEOfriend - Project Context

## Overview
**CEOfriend** is an AI-powered GitHub repository analysis and autonomous remediation platform targeted at technical leaders (CEOs/CTOs). It connects to a GitHub repository, analyzes the codebase for risks, simulates failure scenarios, and can autonomously detect and fix bugs by creating Pull Requests.

The application is built using **Next.js (App Router)** for both frontend and backend API routes, styled with custom CSS and Lucide React icons, and uses **Groq** (specifically `llama-3.3-70b-versatile`) as its core LLM engine.

---

## Core Features & Modules

### 1. Repository Analysis & Dashboard (`/dashboard`)
- **Flow:** Users enter a GitHub repository URL on the landing page. The platform fetches repository stats (commits, issues, contributors, file tree) using the GitHub API.
- **Visuals:** Displays a "CEO Report" with metrics, risk scores, and visualizations (using `recharts`).
- **Relevant Files:**
  - `src/app/page.tsx` (Landing)
  - `src/app/dashboard/page.tsx` (Main Dashboard UI)
  - `src/app/api/analyze-repo/route.ts` (Analysis Backend)
  - `src/modules/repoAgent.ts` (Core analysis logic)

### 2. Scenario Agent (`/api/scenario`)
- **Purpose:** Analyzes the repository data to generate potential "what-if" edge cases, security threats, and system failure scenarios tailored strictly to the repo's actual stack.
- **Relevant Files:**
  - `src/modules/scenarioAgent.ts`
  - `src/utils/scenarioParser.ts`
  - `src/app/api/scenario/route.ts`

### 3. Repo Healer Agent (`/healer`)
- **Purpose:** An autonomous bug-fixing pipeline. It identifies the most critical "hotspot" files, uses the LLM to detect bugs within those specific files, generates minimal code patches, and presents them in a visual diff layout.
- **Capabilities:**
  - **Visual Diffing:** Uses `@monaco-editor/react` to show a side-by-side or inline red/green diff of the original vs. patched code.
  - **Automated PRs:** With a single click ("Raise PR"), it creates a new branch, commits the fix, and opens a PR on GitHub.
- **Relevant Files:**
  - `src/app/healer/page.tsx` (Healer UI & Diff Viewer)
  - `src/modules/healerAgent.ts` (LLM bug detection & diff generation logic)
  - `src/app/api/healer/detect/route.ts` (Bug detection endpoint)
  - `src/app/api/healer/pr/route.ts` (PR creation endpoint)

### 4. GitHub Service Integration
- **Purpose:** Provides all GitHub API abstraction handling rate limiting, retries, and authenticated requests.
- **Capabilities:** Fetching file trees, file content (base64 decoding), fetching issues, creating branches, committing files via PUT requests, and opening PRs via POST requests.
- **Relevant Files:**
  - `src/services/githubService.ts`

---

## Tech Stack
- **Framework:** Next.js (React 19)
- **Language:** TypeScript
- **Icons:** `lucide-react`
- **Charts:** `recharts`
- **Code Editor/Diff Viewer:** `@monaco-editor/react`
- **AI/LLM:** Groq API (`llama-3.3-70b-versatile`)
- **External APIs:** GitHub REST API

## Environment Variables (`.env`)
- `github_fine_grained`: A GitHub Fine-Grained Personal Access Token with `Contents: Read/Write` and `Pull Requests: Read/Write` permissions required to fetch private code and create PRs.
- `groq_1`, `groq_2`: API keys for the Groq LLM service.

---

## Current State & Next Steps (Database Integration)
Currently, analysis and scenarios exist only in memory or are regenerated per session. 
**Goal:** Add a Database layer to:
1. Persist repository analysis results (so reports don't have to be regenerated).
2. Save generated scenarios and their states.
3. Track the history of "Healer" PRs opened by the platform.
