import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createPost, listPosts } from "@/lib/data";
import { apiError, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { createPostSchema, firstIssue } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 12);
  const cursor = request.nextUrl.searchParams.get("cursor");
  const result = await listPosts({ limit, cursor, viewerId: null });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const limit = await rateLimit(`post:create:${user.id}`, 12, 60 * 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = createPostSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const post = await createPost({ authorId: user.id, ...parsed.data });
  return NextResponse.json({ post }, { status: 201 });
}
