import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // MUST use jwt so the callbacks below still fire
  },
  // Enable debug mode to see exact Prisma/Adapter errors in the terminal
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth Error] ${code}`, metadata);
    },
    warn(code) {
      console.warn(`[NextAuth Warning] ${code}`);
    },
    debug(code, metadata) {
      console.dir({ code, metadata }, { depth: null, colors: true });
    },
  },
  providers: [
    GitHubProvider({
      clientId: (process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID || "") as string,
      clientSecret: (process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "") as string,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
      issuer: "https://github.com/login/oauth",
      checks: ["none"], // Required to bypass OIDC issuer validation bugs
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
      // @ts-expect-error - accessToken is populated in nextauth callback
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
