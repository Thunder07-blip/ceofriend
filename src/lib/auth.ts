import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: (process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID || "") as string,
      clientSecret: (process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "") as string,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
      issuer: "https://github.com/login/oauth",
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
