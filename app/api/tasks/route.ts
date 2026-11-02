import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createTask, listTasks } from "@/lib/data";
import { apiError, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { createTaskSchema, firstIssue } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const result = await listTasks({ category, search, cursor });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const limit = await rateLimit(`task:create:${user.id}`, 8, 60 * 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  if (new Date(`${parsed.data.deadline}T23:59:59`) <= new Date()) {
    return apiError("交付日期必须晚于今天");
  }
  const task = await createTask({ publisherId: user.id, ...parsed.data });
  return NextResponse.json({ task }, { status: 201 });
}
