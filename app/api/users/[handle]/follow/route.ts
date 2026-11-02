import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { toggleFollow } from "@/lib/data";
import { apiError, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const limit = await rateLimit(`follow:${user.id}`, 30, 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  const { handle } = await params;
  const result = await toggleFollow(handle, user.id);
  if (!result.ok) return apiError(result.self ? "不能关注自己" : "用户不存在", 400);
  return NextResponse.json(result);
}
