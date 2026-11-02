import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "注册" };

function safeNext(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { next } = await searchParams;
  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <span className="auth-orb" aria-hidden="true" />
        <div className="eyebrow">JOIN THE PRACTICE / 2026</div>
        <h1>不止看见，<br /><span>开始交付。</span></h1>
        <p>一个账号，连接你的作品、协作与学习记录。先发布一个小小的实践，下一段合作会从那里开始。</p>
        <div className="auth-points"><span>12,860 位实践者</span><span>18 个开放任务</span><span>每周更新</span></div>
      </div>
      <AuthForm mode="register" next={safeNext(next)} />
    </div>
  );
}
