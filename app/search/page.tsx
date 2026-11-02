import type { Metadata } from "next";
import Link from "next/link";
import { searchAll } from "@/lib/data";
import { money } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "搜索" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams;
  const q = raw?.trim() || "";
  const results = q ? await searchAll(q) : { posts: [], tasks: [] };

  return (
    <div className="search-page">
      <div className="page-kicker">SEARCH / 搜索</div>
      <h1 style={{ marginTop: 12, fontSize: "clamp(38px,5vw,58px)", letterSpacing: "-.06em", fontWeight: 500 }}>找到下一个方法。</h1>
      <form className="search-form-large" action="/search" method="get">
        <Icon name="i-search" />
        <input name="q" defaultValue={q} placeholder="搜索任务、作品、话题或创作者…" autoFocus aria-label="搜索" />
        <button className="btn btn-dark" type="submit">搜索</button>
      </form>

      {!q ? (
        <div className="search-empty">输入关键词，搜索任务、作品与正在发生的方法。</div>
      ) : (
        <>
          <div className="search-section">
            <h2>作品与讨论 · {results.posts.length}</h2>
            {results.posts.length ? results.posts.map((post) => (
              <Link className="search-result-row" href={`/p/${post.id}`} key={post.id}>
                <div><b>{post.title}</b><span>{post.author.name} · {post.commentCount} 条讨论 · {post.likeCount} 喜欢</span></div>
                <Icon name="i-arrow-up-right" />
              </Link>
            )) : <p className="search-empty">没有找到相关作品。</p>}
          </div>
          <div className="search-section">
            <h2>任务 · {results.tasks.length}</h2>
            {results.tasks.length ? results.tasks.map((task) => (
              <Link className="search-result-row" href={`/tasks/${task.id}`} key={task.id}>
                <div><b>{task.title}</b><span>{task.category} · {money(task.budgetCents)} · {task.publisher.name}</span></div>
                <Icon name="i-arrow-up-right" />
              </Link>
            )) : <p className="search-empty">没有找到相关任务。</p>}
          </div>
        </>
      )}
    </div>
  );
}
