import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyToTask, getTask } from "@/lib/data";
import { apiError, isUuid, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { applyTaskSchema, firstIssue } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const { id } = await params;
  if (!isUuid(id)) return apiError("无效的任务", 404);
  const limit = await rateLimit(`task:apply:${user.id}`, 20, 60 * 60);
  if (!limit.allowed) return rateLimited(limit.resetAt);
  const task = await getTask(id);
  if (!task) return apiError("任务不存在", 404);
  if (task.status !== "open") return apiError("这个任务已停止招募", 409);
  if (task.publisher.id === user.id) return apiError("不能申请自己发布的任务", 409);
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = { message: "希望进一步了解需求，期待与你合作。" };
  }
  const parsed = applyTaskSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const result = await applyToTask(id, user.id, parsed.data.message);
  return NextResponse.json(result, { status: 201 });
}
