"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "操作失败，请稍后再试");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{isLogin ? "回到你的工作流" : "加入穹智"}</h2>
      <p>{isLogin ? "登录后继续参与讨论、申请任务与管理协作。" : "创建账号，发布实践，也可以接下真实项目。"}</p>
      <form className="form-stack" onSubmit={submit}>
        {!isLogin && (
          <div className="field">
            <label htmlFor="name">怎么称呼你</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={40} autoComplete="name" placeholder="例如：林深" />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">邮箱</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="password">密码 <span>{isLogin ? "" : "至少 10 位"}</span></label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isLogin ? 1 : 10} maxLength={128} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••••" />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "请稍候…" : isLogin ? "登录" : "创建账号"}</button>
      </form>
      <div className="auth-switch">
        {isLogin ? <>还没有账号？<Link href={`/register?next=${encodeURIComponent(next)}`}>立即注册</Link></> : <>已经有账号？<Link href={`/login?next=${encodeURIComponent(next)}`}>去登录</Link></>}
      </div>
      {isLogin && <div className="auth-demo"><b>演示账号</b><br />demo@qiongzhi.ai / Qiongzhi2026!</div>}
    </div>
  );
}
