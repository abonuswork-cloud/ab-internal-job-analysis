import { getRequest } from "@tanstack/react-start/server";

import { type SessionUser, verifyIdentityToken } from "./identity-jwt";

export type { SessionUser };

export async function getEnv(): Promise<Record<string, string | undefined>> {
  // Dynamic import: @cloudflare/vite-plugin may not be installed or may lack the
  // ./server export depending on version.
  try {
    const mod = "@cloudflare/vite-plugin/server";
    const { getCloudflareContext } = await import(/* @vite-ignore */ mod);
    const ctx = await getCloudflareContext();
    return ctx.env as Record<string, string | undefined>;
  } catch {
    return process.env as Record<string, string | undefined>;
  }
}

/**
 * Returns the authenticated user from the current request.
 *
 * Verifies the Lovable identity token from the `x-lovable-identity-token`
 * header against the platform's JWKS endpoint. No shared secrets needed.
 *
 * Returns null for unauthenticated requests, including anonymous visits to
 * public apps that did not bootstrap project auth.
 *
 * Only call in server-side code: route loaders or createServerFn handlers.
 */
// Personal single-user tool: no sign-in required. Falls back to the owner's profile.
const OWNER: SessionUser = { userId: "d3bc6408-ed90-5abc-8963-bd711eb60c06", displayName: "Angelica", email: null };

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await getVerifiedUser()) ?? OWNER;
}

async function getVerifiedUser(): Promise<SessionUser | null> {
  const request = getRequest();
  if (!request) return null;

  const env = await getEnv();

  const identityToken = request.headers.get("x-lovable-identity-token");
  if (!identityToken) return null;

  const jwksUrl = env["__LOVABLE_JWKS_URL"];
  if (!jwksUrl) return null;

  try {
    const u = await verifyIdentityToken(identityToken, jwksUrl, env["__LOVABLE_PROJECT_ID"]);
    return u ? { ...u, userId: OWNER.userId } : null;
  } catch {
    return null;
  }
}
