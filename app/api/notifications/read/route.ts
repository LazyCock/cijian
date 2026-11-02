import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { markNotificationsRead } from "@/lib/data";
import { apiError, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  await markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
