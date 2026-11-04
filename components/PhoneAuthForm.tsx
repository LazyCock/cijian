"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PhoneAuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function sendCode() {
    setError("");
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的 11 位手机号");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "验证码发送失败");
        return;
      }
      setCountdown(60);
      setDevCode(data.devCode || "");
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setSending(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/phone/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "登录失败");
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
    <form className="form-stack" onSubmit={submit}>
      <div className="field">
        <label htmlFor="phone">手机号</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
          required
          autoComplete="tel"
          placeholder="请输入 11 位手机号"
        />
      </div>
      <div className="field">
        <label htmlFor="phone-code">验证码 <span>5 分钟内有效</span></label>
        <div className="phone-code-row">
          <input
            id="phone-code"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            autoComplete="one-time-code"
            placeholder="6 位验证码"
          />
          <button type="button" className="btn btn-light btn-sm" disabled={sending || countdown > 0} onClick={sendCode}>
            {sending ? "发送中…" : countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
          </button>
        </div>
      </div>
      {devCode && <p className="phone-devcode">开发模式验证码：<b>{devCode}</b></p>}
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-dark" type="submit" disabled={loading || code.length !== 6}>
        {loading ? "登录中…" : "手机号登录"}
      </button>
      <p className="auth-phone-note">未注册的手机号验证通过后会自动创建账号。</p>
    </form>
  );
}
