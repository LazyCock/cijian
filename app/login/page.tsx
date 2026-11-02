import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "登录" };

function safeNext(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { next } = await searchParams;
  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <span className="auth-orb" aria-hidden="true" />
        <div className="eyebrow">CIJIAN / PRACTICE NETWORK</div>
        <h1>把能力，<br /><span>放回现场。</span></h1>
        <p>这不是一个只收藏灵感的地方。发布你的方法，接下真实的任务，在公开协作里把 AI 用成一套可以交付的能力。</p>
        <div className="auth-points"><span>真实任务</span><span>平台托管</span><span>公开协作</span><span>可验证成果</span></div>
      </div>
      <AuthForm mode="login" next={safeNext(next)} />
    </div>
  );
}
