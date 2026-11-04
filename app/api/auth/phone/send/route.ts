import { createHash, randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/db";
import { apiError, rateLimited } from "@/lib/api";
import { assertSameOrigin } from "@/lib/csrf";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendPhoneCode, SmsError } from "@/lib/sms";
import { firstIssue, sendPhoneCodeSchema } from "@/lib/validation";

function codeHash(phone: string, code: string) {
  const secret = process.env.PHONE_CODE_SECRET || process.env.AUTH_SECRET || "cijian-phone-dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) return apiError("非法请求来源", 403);
  const ipLimit = await rateLimit(`phone:send:ip:${clientIp(request.headers)}`, 10, 60 * 10);
  if (!ipLimit.allowed) return rateLimited(ipLimit.resetAt);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("请求体必须是 JSON");
  }
  const parsed = sendPhoneCodeSchema.safeParse(payload);
  if (!parsed.success) return apiError(firstIssue(parsed.error));
  const { phone } = parsed.data;

  const phoneLimit = await rateLimit(`phone:send:${phone}`, 3, 60 * 10);
  if (!phoneLimit.allowed) return rateLimited(phoneLimit.resetAt);

  const recent = await query<{ created_at: string | Date }>(
    "SELECT created_at FROM phone_codes WHERE phone = $1 ORDER BY created_at DESC LIMIT 1",
    [phone],
  );
  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < 60_000) {
    return apiError("请 60 秒后再获取验证码", 429);
  }

  const id = randomUUID();
  const code = String(randomInt(100000, 1_000_000));
  await query(
    `INSERT INTO phone_codes (id, phone, code_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '5 minutes')`,
    [id, phone, codeHash(phone, code)],
  );

  try {
    const result = await sendPhoneCode(phone, code);
    return NextResponse.json({ ok: true, expiresIn: 300, ...(result.devCode ? { devCode: result.devCode } : {}) });
  } catch (error) {
    await query("DELETE FROM phone_codes WHERE id = $1::uuid", [id]);
    if (error instanceof SmsError) return apiError(error.message, 503);
    console.error("phone code send failed", error);
    return apiError("验证码发送失败，请稍后再试", 500);
  }
}
