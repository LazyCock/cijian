import type { NextRequest } from "next/server";

/**
 * Cookie authentication is combined with a same-origin check for every
 * mutating request. This blocks cross-site form/fetch requests even when a
 * browser emits the Lax cookie.
 */
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const got = new URL(origin);
      const publicHost =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        request.nextUrl.host;
      const configured = process.env.APP_URL ? new URL(process.env.APP_URL).host : null;
      if (got.host !== publicHost && got.host !== configured) {
        return false;
      }
    } catch {
      return false;
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  return true;
}
