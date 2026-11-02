import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(10).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(40),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(4).max(80),
  body: z.string().trim().min(10).max(4_000),
  type: z.enum(["work", "note", "question"]).default("work"),
  cover: z.enum(["film", "brand", "prompt", "question"]).default("film"),
  tags: z.array(z.string().trim().min(1).max(24)).max(5).default([]),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(1_000),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(10).max(3_000),
  category: z.enum(["内容创作", "视频生成", "视觉设计", "Agent 开发", "模型微调", "数据服务"]),
  budget: z.coerce.number().int().min(100).max(1_000_000),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.coerce.number().int().min(1).max(20).default(1),
  tags: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
});

export const applyTaskSchema = z.object({
  message: z.string().trim().min(4).max(800),
});

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "请求参数无效";
}
