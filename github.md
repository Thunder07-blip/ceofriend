# 🐙 GitHub Repository Integration (github.md)
## CEOfriend – Fetch & Analyze User Repositories

---

# 🎯 Purpose

Enable users to:

- Login with GitHub
- View all their repositories (public + private)
- Analyze any repo with a single click

---

# 🧠 System Overview

## Flow

Login with GitHub  
→ Fetch user repositories  
→ Display in UI  
→ User clicks "Analyze"  
→ Trigger analysis pipeline  

---

# ⚙️ Tech Stack

## Frontend
- Next.js (React)
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js API Routes
- GitHub REST API

## Auth
- NextAuth.js (GitHub OAuth)

---

# 🔐 Authentication Setup

Ensure GitHub OAuth is configured via NextAuth.

Token is stored in session:

session.accessToken

---

# 📡 Fetch User Repositories

## API Endpoint

GET /api/github/repos

---

## Backend Implementation

```ts
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  const token = session?.accessToken;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    "https://api.github.com/user/repos?per_page=50",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  const repos = data.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    stars: repo.stargazers_count,
  }));

  return Response.json(repos);
}
```

---

# 🎨 Frontend UI

## Repo List Component

```tsx
"use client";

import { useEffect, useState } from "react";

export default function RepoList() {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    fetch("/api/github/repos")
      .then(res => res.json())
      .then(setRepos);
  }, []);

  return (
    <div className="space-y-4">
      {repos.map((repo: any) => (
        <div
          key={repo.id}
          className="flex justify-between items-center p-4 border rounded-lg"
        >
          <div>
            <h3 className="font-semibold">{repo.name}</h3>
            <p className="text-sm text-gray-500">
              ⭐ {repo.stars} {repo.private && "🔒 Private"}
            </p>
          </div>

          <button
            onClick={() => analyzeRepo(repo.full_name)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Analyze
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

# ⚙️ Analyze Trigger

```ts
async function analyzeRepo(fullName: string) {
  await fetch("/api/analyze-repo", {
    method: "POST",
    body: JSON.stringify({ repo: fullName }),
  });
}
```

---

# 🎨 UI Enhancements

## Add Search

```tsx
<input
  placeholder="Search repos..."
  className="border p-2 rounded w-full"
/>
```

---

## Add Filters

- All repos
- Private only
- Public only

---

## Add Status Indicator

[Analyze] → [Analyzing...] → [View Report]

---

# ⚡ Pagination (Optional)

https://api.github.com/user/repos?per_page=50&page=1

---

# 🔒 Permissions Handling

Before analysis or PR:

GET /repos/{owner}/{repo}

Check:

repo.permissions.push === true

---

# 🧠 UX Flow

User logs in  
→ sees repo list  
→ clicks analyze  
→ sees dashboard  

---

# 🏁 Summary

This feature removes manual repo input and enables seamless one-click analysis of all GitHub repositories using OAuth.

---

## ⚡ One-Line Summary

“Fetch all user repositories via GitHub OAuth and enable one-click analysis.”
