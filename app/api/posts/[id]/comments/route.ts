import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addComment, getComments } from "@/lib/data";
import { apiError, isUuid, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { commentSchema, firstIssue } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return apiError("无效的内容", 404);
  return NextResponse.json({ comments: await getComments(id) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const { id } = await params;
  if (!isUuid(id)) return apiError("无效的内容", 404);
  const limit = await rateLimit(`comment:${user.id}`, 30, 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const result = await addComment(id, user.id, parsed.data.body);
  return NextResponse.json(result, { status: 201 });
}
