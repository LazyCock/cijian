import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { query } from "@/db";

export const SESSION_COOKIE = "qz_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  website: string;
  role: "user" | "admin";
  tokenVersion: number;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  website: string;
  role: "user" | "admin";
  token_version: number;
};

export function sessionSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET?.trim();
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
  }
  return new TextEncoder().encode("qiongzhi-development-secret-change-me");
}

export async function issueSession(user: AuthUser) {
  return new SignJWT({ ver: user.tokenVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("qiongzhi")
    .setAudience("qiongzhi-web")
    .setExpirationTime("7d")
    .sign(sessionSecret());
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

async function userFromToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      issuer: "qiongzhi",
      audience: "qiongzhi-web",
    });
    if (!payload.sub) return null;
    const rows = await query<UserRow>(
      `SELECT id,email,name,handle,avatar_url,bio,location,website,role,token_version
       FROM users WHERE id = $1::uuid LIMIT 1`,
      [payload.sub],
    );
    const row = rows[0];
    if (!row || Number(payload.ver) !== Number(row.token_version)) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      handle: row.handle,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      location: row.location,
      website: row.website,
      role: row.role,
      tokenVersion: row.token_version,
    };
  } catch {
    return null;
  }
}

export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? userFromToken(token) : null;
});

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? userFromToken(token) : null;
}

export async function requireUser(nextPath: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}
