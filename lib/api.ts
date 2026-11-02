import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser } from "./auth";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimited(resetAt: number) {
  return NextResponse.json(
    { error: "请求过于频繁，请稍后再试" },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1_000))) },
    },
  );
}

export async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, response: apiError("请先登录", 401) };
  return { user, response: null };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
