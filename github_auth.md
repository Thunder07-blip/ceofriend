🏆 BEST SIMPLE APPROACH

👉 Use GitHub OAuth via NextAuth.js

⚙️ 1. Setup GitHub OAuth (5–10 mins)
🟦 Step 1: Create GitHub OAuth App

Go to:

👉 https://github.com/settings/developers

Create new OAuth App:

Homepage URL: http://localhost:3000
Callback URL:
http://localhost:3000/api/auth/callback/github
🔑 Step 2: Add to .env
GITHUB_ID=your_client_id
GITHUB_SECRET=your_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random_string
⚙️ 2. Install NextAuth
npm install next-auth
⚙️ 3. Setup Auth Route
📁 /app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
🎨 4. Add Login Button (Frontend)
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Login() {
  const { data: session } = useSession();

  if (!session) {
    return <button onClick={() => signIn("github")}>Login with GitHub</button>;
  }

  return (
    <>
      <p>Logged in</p>
      <button onClick={() => signOut()}>Logout</button>
    </>
  );
}
🔑 5. Use Token for API Calls
Get token:
import { getServerSession } from "next-auth";

const session = await getServerSession();
const token = session?.accessToken;

👉 THIS token = user’s GitHub identity

🚀 6. Create Pull Request API
📁 /api/create-pr/route.ts
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();
  const token = session?.accessToken;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, title, body, head, base } = await req.json();

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    }
  );

  const data = await res.json();

  return Response.json(data);
}
🧠 7. IMPORTANT (Branch Logic)
You CANNOT directly PR to same branch

You must:

Step 1: Create new branch
POST /repos/{owner}/{repo}/git/refs
Step 2: Commit changes
Step 3: Create PR
⚡ 8. FAST HACKATHON SHORTCUT

👉 Instead of full Git flow:

Use:

“PR from existing branch”

OR

👉 Ask user:

“Enter branch name where fixes will be pushed”
🔒 9. Safety Check (IMPORTANT)

Before creating PR:

GET /repos/{owner}/{repo}

Check:

if (!repo.permissions.push) {
  throw new Error("No permission to create PR");
}
🎤 10. What You Say to Judges

“We implemented GitHub OAuth so that pull requests are created using the user’s own identity and permissions, ensuring security and correctness.”

🏁 FINAL FLOW
User logs in
   ↓
Selects repo
   ↓
Analyzes repo
   ↓
Clicks "Create PR"
   ↓
PR created using THEIR GitHub account