import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CreateTaskForm } from "@/components/CreateTaskForm";

export const metadata: Metadata = { title: "发布任务" };

export default async function NewTaskPage() {
  await requireUser("/tasks/new");
  return (
    <div className="page-shell" style={{ maxWidth: 820 }}>
      <Link className="detail-back" href="/tasks">← 返回任务广场</Link>
      <div className="page-head" style={{ display: "block", marginBottom: 22 }}>
        <div className="page-kicker">POST A BRIEF / 发布任务</div>
        <h1 style={{ maxWidth: 700 }}>把需求说清楚，<br /><span style={{ color: "var(--muted)" }}>让合适的人找到你。</span></h1>
        <p style={{ marginTop: 12, maxWidth: 520 }}>平台托管赏金。发布后，创作者可以申请，你选择合适的合作者开始协作。</p>
      </div>
      <CreateTaskForm />
    </div>
  );
}
