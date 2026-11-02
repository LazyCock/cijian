import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { toggleLike } from "@/lib/data";
import { apiError, isUuid, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const { id } = await params;
  if (!isUuid(id)) return apiError("无效的内容", 404);
  const limit = await rateLimit(`post:like:${user.id}`, 120, 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  return NextResponse.json(await toggleLike(id, user.id));
}
