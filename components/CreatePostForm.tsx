"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const covers = [
  ["film", "AI 影像 / 电影感"],
  ["brand", "品牌视觉 / 提案"],
  ["prompt", "提示词 / 工作流"],
  ["question", "开放提问 / 讨论"],
];

export function CreatePostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("work");
  const [cover, setCover] = useState("film");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type,
          cover,
          tags: tags.split(/[，,、]/).map((value) => value.trim()).filter(Boolean).slice(0, 5),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "发布失败");
        return;
      }
      router.push(`/p/${data.post.id}`);
      router.refresh();
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="field"><label htmlFor="post-title">标题</label><input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={4} maxLength={80} placeholder="例如：我把品牌提案流程拆成了 7 个 Prompt" /></div>
      <div className="field"><label htmlFor="post-body">正文 <span>把你的方法、判断与结果写下来</span></label><textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} required minLength={10} maxLength={4000} placeholder="你解决了什么问题？关键动作是什么？结果如何？" style={{ minHeight: 220 }} /></div>
      <div className="form-row">
        <div className="field"><label htmlFor="post-type">内容类型</label><select id="post-type" value={type} onChange={(event) => setType(event.target.value)}><option value="work">作品</option><option value="note">学习笔记</option><option value="question">提问</option></select></div>
        <div className="field"><label htmlFor="post-cover">封面样式</label><select id="post-cover" value={cover} onChange={(event) => setCover(event.target.value)}>{covers.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="post-tags">话题标签 <span>用逗号分隔，最多 5 个</span></label><input id="post-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="提示词工程, 品牌视觉, 工作流" /></div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions"><button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "发布中…" : "发布作品"}</button><span className="form-help">发布后会进入社区与个人主页</span></div>
    </form>
  );
}
