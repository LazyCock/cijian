import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiError, rateLimited, requireApiUser } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { MediaError, storeMedia } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const { user, response } = await requireApiUser();
  if (!user) return response;
  const limit = await rateLimit(`media:upload:${user.id}`, 40, 60 * 10);
  if (!limit.allowed) return rateLimited(limit.resetAt);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("上传请求格式不正确");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return apiError("请选择要上传的图片或视频");

  try {
    const media = await storeMedia(file);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaError) return apiError(error.message, 400);
    console.error("media upload failed", error);
    return apiError("文件处理失败，请换一个文件重试", 500);
  }
}
