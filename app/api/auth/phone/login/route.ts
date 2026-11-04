import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
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
import { firstIssue, phoneLoginSchema } from "@/lib/validation";

type UserRow = {
  id: string; email: string; name: string; handle: string; avatar_url: string | null;
  bio: string; location: string; website: string; role: "user" | "admin"; token_version: number;
};

function hashCode(phone: string, code: string) {
  const secret = process.env.PHONE_CODE_SECRET || process.env.AUTH_SECRET || "cijian-phone-dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

function sameHash(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const ipLimit = await rateLimit(`phone:login:ip:${clientIp(request.headers)}`, 20, 60 * 10);
  if (!ipLimit.allowed) return rateLimited(ipLimit.resetAt);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = phoneLoginSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const { phone, code } = parsed.data;

  const phoneLimit = await rateLimit(`phone:login:${phone}`, 10, 60 * 10);
  if (!phoneLimit.allowed) return rateLimited(phoneLimit.resetAt);

  const codes = await query<{
    id: string; code_hash: string; expires_at: string | Date; attempts: number; consumed: boolean;
  }>(
    `SELECT id, code_hash, expires_at, attempts, consumed
     FROM phone_codes WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  const record = codes[0];
  if (!record || record.consumed || new Date(record.expires_at).getTime() <= Date.now()) {
    return apiError("验证码已失效，请重新获取", 400);
  }
  if (record.attempts >= 5) return apiError("验证码尝试次数过多，请重新获取", 429);
  if (!sameHash(record.code_hash, hashCode(phone, code))) {
    await query("UPDATE phone_codes SET attempts = attempts + 1 WHERE id = $1::uuid", [record.id]);
    return apiError("验证码不正确", 400);
  }
  await query("UPDATE phone_codes SET consumed = true WHERE id = $1::uuid", [record.id]);

  let rows = await query<UserRow>(
    `SELECT id,email,name,handle,avatar_url,bio,location,website,role,token_version
     FROM users WHERE phone = $1 LIMIT 1`,
    [phone],
  );

  if (!rows[0]) {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    const displayName = `手机用户${phone.slice(-4)}`;
    const handle = `qz_${randomBytes(4).toString("hex")}`;
    const placeholderEmail = `${phone}@phone.cijian.local`;
    try {
      rows = await query<UserRow>(
        `INSERT INTO users (id,email,password_hash,name,handle,phone,bio)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id,email,name,handle,avatar_url,bio,location,website,role,token_version`,
        [id, placeholderEmail, passwordHash, displayName, handle, phone, "刚刚加入此见，正在把 AI 放进自己的工作流。"],
      );
    } catch {
      rows = await query<UserRow>(
        `SELECT id,email,name,handle,avatar_url,bio,location,website,role,token_version
         FROM users WHERE phone = $1 LIMIT 1`,
        [phone],
      );
    }
  }

  const row = rows[0];
  if (!row) return apiError("登录失败，请稍后再试", 500);

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
