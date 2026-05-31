import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const portalAuthIssuer = process.env.PORTALAUTH_OIDC_ISSUER ?? "http://localhost:5112";
export const portalAuthClientId = process.env.PORTALAUTH_OIDC_CLIENT_ID ?? "openfiis-local";
export const portalAuthClientSecret = process.env.PORTALAUTH_OIDC_CLIENT_SECRET ?? "openfiis-local-dev-secret";
export const authSecret = process.env.NEXTAUTH_SECRET ?? "openfiis-local-nextauth-dev-secret";

type PortalAuthProfile = {
  sub: string;
  email?: string;
  name?: string;
  role?: string | string[];
  permission?: string | string[];
  department?: string;
};

export type OpenFIIsSession = Session & {
  accessToken?: string;
  user: Session["user"] & {
    department?: string;
    id: string;
    permissions: string[];
    roles: string[];
  };
};

export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ account, profile, token }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (profile) {
        const portalProfile = profile as PortalAuthProfile;
        token.sub = portalProfile.sub;
        token.department = portalProfile.department;
        token.permissions = normalizeClaim(portalProfile.permission);
        token.roles = normalizeClaim(portalProfile.role);
      }

      return token;
    },
    async session({ session, token }) {
      const typedToken = token as JWT & {
        accessToken?: string;
        department?: string;
        permissions?: string[];
        roles?: string[];
      };

      const typedSession = session as OpenFIIsSession;
      typedSession.accessToken = typedToken.accessToken;
      typedSession.user.id = typedToken.sub ?? "";
      typedSession.user.department = typedToken.department;
      typedSession.user.permissions = typedToken.permissions ?? [];
      typedSession.user.roles = typedToken.roles ?? [];

      return typedSession;
    }
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    {
      authorization: {
        params: {
          scope: "openid profile email roles permissions department offline_access"
        }
      },
      checks: ["pkce", "state"],
      clientId: portalAuthClientId,
      clientSecret: portalAuthClientSecret,
      id: "portalauth",
      idToken: true,
      name: "PortalAuth",
      profile(profile: PortalAuthProfile) {
        return {
          email: profile.email,
          id: profile.sub,
          name: profile.name ?? profile.email ?? profile.sub
        };
      },
      type: "oauth",
      wellKnown: `${portalAuthIssuer}/.well-known/openid-configuration`
    }
  ],
  secret: authSecret,
  session: {
    strategy: "jwt"
  }
};

export function normalizeClaim(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}
