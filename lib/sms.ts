import { createHmac, randomUUID } from "node:crypto";

export class SmsError extends Error {}

function percentEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "%20");
}

function hasAliyunConfig() {
  return Boolean(
    process.env.ALIYUN_SMS_ACCESS_KEY_ID &&
      process.env.ALIYUN_SMS_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_SMS_SIGN_NAME &&
      process.env.ALIYUN_SMS_TEMPLATE_CODE,
  );
}

async function sendAliyun(phone: string, code: string) {
  const params: Record<string, string> = {
    AccessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID!,
    Action: "SendSms",
    Format: "JSON",
    PhoneNumbers: phone,
    RegionId: process.env.ALIYUN_SMS_REGION_ID || "cn-hangzhou",
    SignName: process.env.ALIYUN_SMS_SIGN_NAME!,
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: randomUUID(),
    SignatureVersion: "1.0",
    TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: "2017-05-25",
  };

  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
  const stringToSign = `GET&%2F&${percentEncode(canonical)}`;
  const signature = createHmac("sha1", `${process.env.ALIYUN_SMS_ACCESS_KEY_SECRET!}&`)
    .update(stringToSign)
    .digest("base64");
  const url = `https://dysmsapi.aliyuncs.com/?${canonical}&Signature=${percentEncode(signature)}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  const data = (await response.json().catch(() => ({}))) as { Code?: string; Message?: string };
  if (!response.ok || data.Code !== "OK") {
    throw new SmsError(data.Message || "短信发送失败");
  }
}

export async function sendPhoneCode(phone: string, code: string): Promise<{ devCode?: string }> {
  if (hasAliyunConfig()) {
    await sendAliyun(phone, code);
    return {};
  }

  if (process.env.SMS_DEV_MODE === "true" || process.env.NODE_ENV !== "production") {
    console.log(`[phone-login] ${phone} verification code: ${code}`);
    return { devCode: code };
  }

  throw new SmsError("短信服务尚未配置，请联系管理员");
}
