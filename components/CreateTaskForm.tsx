"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const categories = ["内容创作", "视频生成", "视觉设计", "Agent 开发", "模型微调", "数据服务"];

export function CreateTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("内容创作");
  const [budget, setBudget] = useState("1800");
  const [deadline, setDeadline] = useState("");
  const [slots, setSlots] = useState("1");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          budget: Number(budget),
          deadline,
          slots: Number(slots),
          tags: tags.split(/[，,、]/).map((value) => value.trim()).filter(Boolean).slice(0, 6),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "发布失败");
        return;
      }
      router.push(`/tasks/${data.task.id}`);
      router.refresh();
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="field"><label htmlFor="task-title">任务标题</label><input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={4} maxLength={100} placeholder="例如：为护肤品牌制作 15 秒 AI 概念广告片" /></div>
      <div className="field"><label htmlFor="task-desc">需求说明 <span>把验收标准写清楚</span></label><textarea id="task-desc" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={10} maxLength={3000} placeholder="目标、风格、参考、交付格式、验收标准…" /></div>
      <div className="form-row">
        <div className="field"><label htmlFor="task-category">任务类型</label><select id="task-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="task-budget">赏金（元）</label><input id="task-budget" type="number" min={100} max={1000000} value={budget} onChange={(event) => setBudget(event.target.value)} required /></div>
      </div>
      <div className="form-row">
        <div className="field"><label htmlFor="task-deadline">交付日期</label><input id="task-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required min={new Date().toISOString().slice(0, 10)} /></div>
        <div className="field"><label htmlFor="task-slots">招募人数</label><input id="task-slots" type="number" min={1} max={20} value={slots} onChange={(event) => setSlots(event.target.value)} required /></div>
      </div>
      <div className="field"><label htmlFor="task-tags">技能标签 <span>用逗号分隔，最多 6 个</span></label><input id="task-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Runway, 分镜, 品牌短片" /></div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions"><button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "发布中…" : "发布任务"}</button><span className="form-help">发布即表示同意平台协作规则</span></div>
    </form>
  );
}
