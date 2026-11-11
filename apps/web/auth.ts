import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,

      client: {
        token_endpoint_auth_method: "none",
      },

      checks: ["pkce", "state"],
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.accessTokenExpiresAt = account.expires_at;
      }

      return token;
    },
  },
});