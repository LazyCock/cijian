import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getTaskStats, listTasks } from "@/lib/data";
import { compact, money } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { TaskRow } from "@/components/TaskRow";

export const metadata: Metadata = { title: "任务广场" };

const categories = ["全部", "内容创作", "视频生成", "视觉设计", "Agent 开发", "模型微调", "数据服务"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || "全部";
  const search = params.q?.trim() || "";
  const cursor = params.cursor || null;
  const [user, stats, result] = await Promise.all([
    getSessionUser(),
    getTaskStats(),
    listTasks({ category, search, cursor, limit: 20 }),
  ]);

  const query = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    if (category !== "全部") next.set("category", category);
    if (search) next.set("q", search);
    for (const [key, value] of Object.entries(extra)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const value = next.toString();
    return value ? `/tasks?${value}` : "/tasks";
  };

  return (
    <>
      <div className="wide-shell">
        <section className="task-hero">
          <div className="task-hero-copy">
            <div className="page-kicker">OPEN CALLS / {stats.open} 个任务正在招募</div>
            <h1>把能力，<br /><span>放到对的位置。</span></h1>
            <p>明确目标、交付标准与报酬，让一次合作从一句“你能做吗”变成可被验收的成果。赏金由平台托管，验收后结算。</p>
            <div className="task-hero-actions">
              <Link className="btn btn-dark" href="/tasks/new">发布一个任务 <Icon name="i-plus" /></Link>
              <Link className="btn btn-light" href="/learn"><Icon name="i-book" />协作指南</Link>
            </div>
          </div>
          <aside className="task-hero-side">
            <div className="side-head"><span>THIS WEEK / 平台数据</span><b>实时更新</b></div>
            <div className="hero-stat-grid">
              <div><b>{stats.open}</b><span>个开放任务</span></div>
              <div><b>{money(stats.budget)}</b><span>本周任务资金</span></div>
              <div><b>342</b><span>位创作者在接单</span></div>
              <div><b>2.4 天</b><span>平均交付周期</span></div>
            </div>
            <div className="escrow-note"><Icon name="i-shield" />所有赏金由平台托管 · 验收后 T+1 到账</div>
          </aside>
        </section>

        <div className="task-filterbar">
          <div className="task-filter-pills">
            {categories.map((item) => (
              <Link key={item} className={`task-filter-pill ${category === item ? "active" : ""}`} href={query({ category: item === "全部" ? undefined : item, cursor: undefined })}>
                {item}
              </Link>
            ))}
          </div>
          <form action="/tasks" method="get">
            {category !== "全部" && <input type="hidden" name="category" value={category} />}
            <input name="q" defaultValue={search} placeholder="搜索任务" aria-label="搜索任务" />
            <button className="btn btn-light btn-sm" type="submit"><Icon name="i-search" />搜索</button>
          </form>
        </div>

        <div className="task-list-meta">
          <span>{result.items.length} 个任务{search ? ` · 搜索「${search}」` : ""}</span>
          <span>赏金托管 · 平台担保</span>
        </div>

        <div className="task-grid">
          {result.items.length ? result.items.map((task, index) => <TaskRow key={task.id} task={task} index={index} />) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <h3>没有找到匹配的任务</h3>
              <p>换一个关键词，或清除筛选条件试试。</p>
              <Link className="btn btn-light btn-sm" href="/tasks" style={{ marginTop: 14 }}>查看全部任务</Link>
            </div>
          )}
        </div>

        {result.nextCursor && (
          <div className="pagination">
            <Link className="btn btn-light btn-sm" href={query({ cursor: result.nextCursor })}>下一页 <Icon name="i-arrow-right" /></Link>
          </div>
        )}
      </div>
    </>
  );
}
