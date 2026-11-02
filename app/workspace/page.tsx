import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/data";
import { daysLeft, money, statusLabel, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "工作台" };
export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/workspace");
  const { tab: rawTab } = await searchParams;
  const tab = ["assigned", "published", "saved"].includes(rawTab || "") ? (rawTab as string) : "assigned";
  const data = await getWorkspace(user.id);
  const items = tab === "assigned" ? data.assigned : tab === "published" ? data.published : data.saved;

  return (
    <div className="workspace-page">
      <div className="workspace-head" style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div className="page-kicker">WORKSPACE / 我的协作</div>
          <h1 style={{ marginTop: 12, fontSize: "clamp(38px,5vw,64px)", lineHeight: 1.02, letterSpacing: "-.065em", fontWeight: 500 }}>让每一次协作，<br /><span style={{ color: "var(--muted)" }}>都有下一步。</span></h1>
          <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 11 }}>申请、交付、验收、结算，所有进行中的事情都在这里。</p>
        </div>
        <div className="workspace-create" style={{ marginBottom: 0 }}>
          <Link className="btn btn-light" href={`/u/${user.handle}`}>个人主页</Link>
          <Link className="btn btn-dark" href="/tasks/new"><Icon name="i-plus" />发布任务</Link>
        </div>
      </div>

      <div className="workspace-stat-grid">
        <div className="workspace-stat lime"><span><Icon name="i-bolt" />进行中的协作</span><b>{data.assigned.length}</b><small>个</small></div>
        <div className="workspace-stat"><span><Icon name="i-briefcase" />我发布的任务</span><b>{data.published.length}</b><small>个</small></div>
        <div className="workspace-stat"><span><Icon name="i-bookmark" />我的收藏</span><b>{data.saved.length}</b><small>件</small></div>
        <div className="workspace-stat"><span><Icon name="i-shield" />按时交付率</span><b>96.4<small>%</small></b></div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="工作台分类">
        <Link className={`workspace-tab ${tab === "assigned" ? "active" : ""}`} href="/workspace?tab=assigned" role="tab">我接取的任务<span className="count">{data.assigned.length}</span></Link>
        <Link className={`workspace-tab ${tab === "published" ? "active" : ""}`} href="/workspace?tab=published" role="tab">我发布的任务<span className="count">{data.published.length}</span></Link>
        <Link className={`workspace-tab ${tab === "saved" ? "active" : ""}`} href="/workspace?tab=saved" role="tab">已收藏<span className="count">{data.saved.length}</span></Link>
      </div>

      {tab !== "saved" ? (
        <div className="workspace-list">
          {items.length ? (items as typeof data.assigned).map((item) => (
            <div className="workspace-row" key={item.id}>
              <div>
                <div className="work-row-top" style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <span className="tag orange">{item.category}</span>
                  <span className={`status-pill ${item.status === "submitted" ? "pending" : "active"}`}>{statusLabel(item.status)}</span>
                  <span style={{ color: "var(--muted-2)", fontSize: 8 }}>{daysLeft(item.deadline)}</span>
                </div>
                <h3><Link href={`/tasks/${item.id}`}>{item.title}</Link></h3>
                <p>需求方 {item.publisher.name} · {money(item.budgetCents)} · {item.applicantCount} 份申请 · 更新于 {timeAgo(item.createdAt)}</p>
              </div>
              <div className="workspace-row-actions">
                <Link className="btn btn-dark btn-sm" href={`/tasks/${item.id}`}>{tab === "assigned" ? "查看协作" : "管理任务"} <Icon name="i-arrow-up-right" /></Link>
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <h3>{tab === "assigned" ? "还没有接取任务" : "还没有发布过任务"}</h3>
              <p>{tab === "assigned" ? "去任务广场找到第一个适合你的需求。" : "把需求说清楚，合适的创作者会来找你。"}</p>
              <Link className="btn btn-dark btn-sm" href={tab === "assigned" ? "/tasks" : "/tasks/new"} style={{ marginTop: 14 }}>{tab === "assigned" ? "去任务广场" : "发布第一个任务"}</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="workspace-list">
          {data.saved.length ? data.saved.map((post) => (
            <Link className="workspace-row" href={`/p/${post.id}`} key={post.id} style={{ textDecoration: "none", color: "inherit" }}>
              <div><h3>{post.title}</h3><p>{post.author.name} · {timeAgo(post.createdAt)} · {post.commentCount} 条讨论</p></div>
              <div className="workspace-row-actions"><span className="btn btn-light btn-sm">查看作品 <Icon name="i-arrow-up-right" /></span></div>
            </Link>
          )) : <div className="empty-state" style={{ marginTop: 18 }}><h3>收藏夹还是空的</h3><p>看到感兴趣的内容时，点一下书签就会出现在这里。</p></div>}
        </div>
      )}

      <div className="workspace-note" style={{ marginTop: 18 }}><Icon name="i-shield" />所有任务赏金均由平台托管。验收确认后 T+1 个工作日结算，纠纷可随时申请平台介入。</div>
    </div>
  );
}
