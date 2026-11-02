import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getApplicationForTask, getTask, listTasks } from "@/lib/data";
import { daysLeft, money, statusLabel } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { TaskApplyForm } from "@/components/TaskApplyForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const task = await getTask(id);
  return { title: task?.title || "任务详情" };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, user] = await Promise.all([getTask(id), getSessionUser()]);
  if (!task) notFound();
  const applicationStatus = user ? await getApplicationForTask(task.id, user.id) : null;
  const isPublisher = user?.id === task.publisher.id;
  const related = await listTasks({ category: task.category, limit: 3 });

  return (
    <div className="detail-shell">
      <Link className="detail-back" href="/tasks"><Icon name="i-arrow-up-right" />返回任务广场</Link>
      <div className="task-detail">
        <main className="task-detail-main">
          <div className="task-detail-tags">
            <span className="tag blue">{task.category}</span>
            <span className={`tag ${task.status === "open" ? "lime" : "orange"}`}>{statusLabel(task.status)}</span>
            <span className="tag outline">{daysLeft(task.deadline)}</span>
          </div>
          <h1>{task.title}</h1>
          <p className="task-detail-lead">{task.description}</p>

          <div className="task-detail-meta">
            <div><span>任务赏金</span><b>{money(task.budgetCents)}</b></div>
            <div><span>交付日期</span><b>{task.deadline}</b></div>
            <div><span>招募人数</span><b>{task.slots} 人 · {task.applicantCount} 份申请</b></div>
          </div>

          <section className="task-detail-section">
            <h2>需求说明</h2>
            <p>{task.description}</p>
          </section>
          <section className="task-detail-section">
            <h2>交付物</h2>
            <div className="task-deliverables">
              <div className="task-deliverable"><Icon name="i-check-circle" /><span>按需求说明提交可验收的最终成果</span></div>
              <div className="task-deliverable"><Icon name="i-check-circle" /><span>交付说明与必要的源文件</span></div>
              <div className="task-deliverable"><Icon name="i-check-circle" /><span>约定范围内的必要修改支持</span></div>
            </div>
          </section>
          <section className="task-detail-section">
            <h2>技能标签</h2>
            <div className="drawer-tags">{task.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          </section>
          <section className="task-detail-section">
            <h2>协作流程</h2>
            <div className="drawer-timeline">
              {[["发布需求", "赏金已托管"], ["申请与沟通", "选择合适合作者"], ["交付与验收", "按约定验收"], ["结算", "验收后 T+1"]].map(([title, text]) => (
                <div className="timeline-row" key={title}><span className="timeline-dot" /><div className="timeline-copy"><b>{title}</b><span>{text}</span></div></div>
              ))}
            </div>
          </section>
        </main>

        <aside className="task-apply">
          <div className="page-kicker">TASK ESCROW / 平台担保</div>
          <div className="price">{money(task.budgetCents)}<small>含平台托管</small></div>
          <p>{daysLeft(task.deadline)} · 招募 {task.slots} 人</p>
          <div className="task-publisher">
            <Avatar name={task.publisher.name} handle={task.publisher.handle} url={task.publisher.avatarUrl} size={33} />
            <div><b>{task.publisher.name}</b><span>需求方 · @{task.publisher.handle}</span></div>
          </div>
          <TaskApplyForm taskId={task.id} status={applicationStatus} isAuthenticated={Boolean(user)} isPublisher={isPublisher} taskStatus={task.status} />
          <p className="task-detail-aside-note"><Icon name="i-shield" /> 所有任务赏金由平台托管。验收确认后 T+1 个工作日结算，纠纷可申请平台介入。</p>
        </aside>
      </div>

      <section className="task-detail-section" style={{ maxWidth: 1000, marginTop: 56 }}>
        <h2>同类任务</h2>
        <div className="task-grid">
          {related.items.filter((item) => item.id !== task.id).slice(0, 3).map((item, index) => (
            <Link className="related-task" href={`/tasks/${item.id}`} key={item.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.title}</b>
              <small>{money(item.budgetCents)}</small>
              <Icon name="i-arrow-up-right" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
