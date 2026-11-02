import Link from "next/link";
import type { Task } from "@/lib/data";
import { compact, daysLeft, money, statusLabel } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export function TaskRow({ task, index }: { task: Task; index: number }) {
  const state = task.applicationStatus || (task.status === "open" ? "open" : task.status);
  return (
    <Link className="task-card task-line" href={`/tasks/${task.id}`} aria-label={`查看任务：${task.title}`}>
      <span className="task-line-no">{String(index + 1).padStart(2, "0")}</span>
      <div className="task-line-main">
        <div className="task-line-top">
          <span className={`tag ${task.category === "视频生成" ? "orange" : task.category === "Agent 开发" ? "blue" : task.category === "视觉设计" ? "violet" : "lime"}`}>{task.category}</span>
          <span className="task-line-status">{state === "accepted" ? "已接单" : state === "pending" ? "已申请" : statusLabel(state)}</span>
          <span className="task-line-deadline">{daysLeft(task.deadline)}</span>
        </div>
        <h3>{task.title}</h3>
        <p className="task-line-desc">{task.description}</p>
        <div className="task-line-tags">{task.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="task-line-foot">
          <Avatar name={task.publisher.name} handle={task.publisher.handle} url={task.publisher.avatarUrl} size={16} />
          <b>{task.publisher.name}</b><span>·</span><span>{task.applicantCount} 人申请</span><span>·</span><span>招募 {task.slots}</span>
        </div>
      </div>
      <div className="task-line-side">
        <div className="task-line-reward"><small>¥</small>{money(task.budgetCents).replace("¥", "")}</div>
        <div className="task-line-applicants">{compact(task.applicantCount)} 人已申请 · 招募 {task.slots}</div>
        <span className="task-line-cta">查看详情 <Icon name="i-arrow-up-right" /></span>
      </div>
    </Link>
  );
}
