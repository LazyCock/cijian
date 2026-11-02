import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { updateProfile } from "@/lib/data";
import { apiError, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { firstIssue } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2).max(40),
  bio: z.string().trim().max(600).default(""),
  location: z.string().trim().max(80).default(""),
  website: z.string().trim().max(160).default(""),
});

export async function PATCH(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const limit = await rateLimit(`profile:update:${user.id}`, 20, 60 * 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  await updateProfile(user.id, parsed.data);
  return NextResponse.json({ ok: true });
}
