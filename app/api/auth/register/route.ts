import { randomBytes, randomUUID } from "node:crypto";
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
import { firstIssue, registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const ipLimit = await rateLimit(`register:ip:${clientIp(request.headers)}`, 8, 60 * 10);
  if (!ipLimit.allowed) return rateLimited(ipLimit.resetAt);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const { name, email, password } = parsed.data;

  const existing = await query<{ id: string }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existing[0]) return apiError("这个邮箱已经注册", 409);

  const id = randomUUID();
  const handle = `qz_${randomBytes(4).toString("hex")}`;
  const hash = await bcrypt.hash(password, 12);
  const rows = await query<{
    id: string; email: string; name: string; handle: string; avatar_url: string | null;
    bio: string; location: string; website: string; role: "user" | "admin"; token_version: number;
  }>(
    `INSERT INTO users (id,email,password_hash,name,handle,bio)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id,email,name,handle,avatar_url,bio,location,website,role,token_version`,
    [id, email, hash, name, handle, "刚刚加入此见，正在把 AI 放进自己的工作流。"],
  );
  const row = rows[0];
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
  const response = NextResponse.json({ user: { id: user.id, name: user.name, handle: user.handle } }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
