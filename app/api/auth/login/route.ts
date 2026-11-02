import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/db";
import {
  SESSION_COOKIE,
  issueSession,
  sessionCookieOptions,
  type AuthUser,
} from "@/lib/auth";
import { apiError, rateLimited } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { firstIssue, loginSchema } from "@/lib/validation";

type LoginRow = {
  id: string; email: string; password_hash: string; name: string; handle: string;
  avatar_url: string | null; bio: string; location: string; website: string;
  role: "user" | "admin"; token_version: number;
};

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const ip = clientIp(request.headers);
  const ipLimit = await rateLimit(`login:ip:${ip}`, 30, 60);
  if (!ipLimit.allowed) return rateLimited(ipLimit.resetAt);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const { email, password } = parsed.data;

  const emailLimit = await rateLimit(`login:email:${email}`, 8, 60);
  if (!emailLimit.allowed) return rateLimited(emailLimit.resetAt);

  const rows = await query<LoginRow>(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email],
  );
  const row = rows[0];
  const valid = row ? await bcrypt.compare(password, row.password_hash) : false;
  if (!row || !valid) return apiError("邮箱或密码不正确", 401);

  const user: AuthUser = {
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
  const token = await issueSession(user);
  const response = NextResponse.json({ user: { id: user.id, name: user.name, handle: user.handle } });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
