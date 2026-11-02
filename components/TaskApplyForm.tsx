"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function TaskApplyForm({
  taskId,
  status,
  isAuthenticated,
  isPublisher,
  taskStatus,
}: {
  taskId: string;
  status: string | null;
  isAuthenticated: boolean;
  isPublisher: boolean;
  taskStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [message, setMessage] = useState("我读过需求说明，可以先按这个方向做一版。");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (!response.ok) {
        setError(data.error || "申请失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <Link className="btn btn-dark" href={`/login?next=${encodeURIComponent(pathname)}`}>登录后申请 <Icon name="i-arrow-up-right" /></Link>;
  }
  if (isPublisher) {
    return <Link className="btn btn-light" href="/workspace">管理这个任务 <Icon name="i-arrow-right" /></Link>;
  }
  if (status === "accepted") {
    return <Link className="btn btn-dark" href="/workspace">已在协作中 · 查看工作台 <Icon name="i-arrow-right" /></Link>;
  }
  if (status === "pending") {
    return <span className="tag blue" style={{ display: "inline-flex", height: 30 }}>申请已提交 · 等待需求方确认</span>;
  }
  if (taskStatus !== "open") {
    return <span className="tag lime" style={{ display: "inline-flex", height: 30 }}>任务已停止招募</span>;
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="field">
        <label htmlFor="apply-message">给需求方的话</label>
        <textarea id="apply-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={4} maxLength={800} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "提交中…" : "提交申请"} <Icon name="i-arrow-up-right" /></button>
      <p className="form-help">申请通过后，平台会生成协作协议并托管赏金。</p>
    </form>
  );
}
