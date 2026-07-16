import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Temporary private-beta access gate: HTTP Basic Auth in front of the whole
 * site, including static files under public/ (e.g. Academy HTML modules).
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` (the
 * `middleware` name is deprecated and no longer supported on the Edge
 * runtime going forward — see the version-16 upgrade guide). `proxy` always
 * runs on the Node.js runtime, which is why the Node `crypto` module below
 * is safe to use here.
 *
 * Disabling the gate later requires no code change: just remove
 * BASIC_AUTH_USER (and BASIC_AUTH_PASSWORD) from the environment.
 */

const REALM = "STRUCTURA";

/** Fixed-length digest comparison avoids both the RangeError that
 * `timingSafeEqual` throws on mismatched buffer lengths and the timing leak
 * of comparing variable-length inputs directly. */
function constantTimeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export function proxy(request: NextRequest): NextResponse {
  const expectedUser = process.env.BASIC_AUTH_USER;

  // No credentials configured -> gate is a no-op. This is the intended way
  // to turn the beta gate off without touching this file.
  if (!expectedUser) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? "";
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return unauthorized();
  }

  const suppliedUser = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);

  const userOk = constantTimeEqual(suppliedUser, expectedUser);
  const passwordOk = constantTimeEqual(suppliedPassword, expectedPassword);

  if (!userOk || !passwordOk) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next.js internals and metadata files that must
    // load unauthenticated for the app shell itself to render correctly.
    "/((?!_next/static|_next/image|_vercel|favicon.ico).*)",
  ],
};
