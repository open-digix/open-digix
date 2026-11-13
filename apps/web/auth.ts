import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

const publicIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
const internalKeycloakUrl = process.env.AUTH_KEYCLOAK_INTERNAL_URL;

export const { handlers, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: publicIssuer,

      authorization: `${publicIssuer}/protocol/openid-connect/auth`,
      token: `${internalKeycloakUrl}/realms/digix/protocol/openid-connect/token`,
      userinfo: `${internalKeycloakUrl}/realms/digix/protocol/openid-connect/userinfo`,

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
