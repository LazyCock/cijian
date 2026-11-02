import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getFeaturedPosts, getHomeTasks, getLatestPosts } from "@/lib/data";
import { daysLeft, money, timeAgo } from "@/lib/format";
import { CommunityShowcase } from "@/components/CommunityShowcase";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const [featured, tasks, latest] = await Promise.all([
    getFeaturedPosts(user?.id),
    getHomeTasks(),
    getLatestPosts(user?.id, 3),
  ]);

  return (
    <div className="home-page">
      <section className="md-hero" aria-labelledby="mdHeroTitle">
        <div className="md-stars" aria-hidden="true" />
        <div className="md-ghost-word" aria-hidden="true">QIONGZHI</div>
        <div className="md-eclipse" aria-hidden="true"><span className="md-eclipse-rim" /><span className="md-eclipse-glow" /></div>
        <div className="md-hero-inner">
          <div className="md-kicker"><span className="md-pulse" />OPEN AI PRACTICE NETWORK · 2026</div>
          <h1 id="mdHeroTitle">让 AI 能力，<br /><span>找到它的用武之地。</span></h1>
          <p>从一次提问，到一次交付。学习 AI 方法、分享创作实践，也把具体能力交给真正需要它的人。</p>
          <form className="md-search" action="/search" method="get" role="search">
            <input name="q" type="search" placeholder="搜任务、作品或创作者…" autoComplete="off" aria-label="搜索任务、作品或创作者" />
            <button className="md-search-submit" type="submit" aria-label="开始搜索"><Icon name="i-arrow-up-right" /></button>
          </form>
          <div className="md-actions">
            <Link className="btn md-primary" href="/tasks">浏览任务<Icon name="i-arrow-right" /></Link>
            <Link className="btn" href="/new">发布作品</Link>
          </div>
          <div className="md-metrics">
            <div><b>12,860</b><span>活跃创作者</span></div>
            <div><b>¥284.6k</b><span>本月已结算</span></div>
            <div><b>96.4%</b><span>任务验收率</span></div>
          </div>
          <div className="md-scroll">SCROLL TO EXPLORE <i /></div>
        </div>
      </section>

      <CommunityShowcase posts={featured} isAuthenticated={Boolean(user)} />

      <section className="home-latest" style={{ paddingTop: 78 }}>
        <div className="home-latest-head">
          <div>
            <div className="explore-kicker">OPEN DISCUSSIONS / LIVE FROM THE COMMUNITY</div>
            <h2>正在发生</h2>
          </div>
          <div>
            <p>精选之外，社区一直在流动。提问、复盘、找到同行。</p>
            <Link className="explore-link" href="/community" style={{ marginTop: 12 }}>进入社区<Icon name="i-arrow-right" /></Link>
          </div>
        </div>
        {latest.length ? (
          <div className="post-list">
            {latest.map((post, index) => (
              <Link className="post-list-item" href={`/p/${post.id}`} key={post.id}>
                <span className="post-list-no">{String(index + 1).padStart(2, "0")}</span>
                <div className="post-list-main">
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                  <div className="post-list-meta"><span>{post.author.name}</span><span>·</span><span>{timeAgo(post.createdAt)}</span><span>·</span><span>{post.commentCount} 条讨论</span></div>
                </div>
                <span className="post-list-arrow"><Icon name="i-arrow-up-right" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="latest-empty">暂时没有新的讨论，去发布第一个问题。</div>
        )}
      </section>

      <div className="home-wide" style={{ marginTop: 90 }}>
        <section className="home-section home-section-tasks" aria-labelledby="homeTasksTitle">
          <div className="home-section-head">
            <div>
              <div className="home-section-kicker">OPEN CALLS / {tasks.length} LIVE BRIEFS</div>
              <h2 id="homeTasksTitle">把能力，<br /><span>放到对的位置。</span></h2>
            </div>
            <div className="home-section-side">
              <p>明确目标、交付标准与报酬，让一次合作从一句“你能做吗”变成可被验收的成果。赏金由平台托管，验收后结算。</p>
              <Link className="explore-link" href="/tasks">查看全部任务<Icon name="i-arrow-right" /></Link>
            </div>
          </div>
          {tasks.length ? (
            <div className="home-task-list">
              {tasks.map((task, index) => (
                <Link className="home-task-row" href={`/tasks/${task.id}`} key={task.id}>
                  <span className="home-task-no">{String(index + 1).padStart(2, "0")}</span>
                  <span className="home-task-copy">
                    <span className="home-task-meta">{task.category} · {task.publisher.name} · {daysLeft(task.deadline)}</span>
                    <b>{task.title}</b>
                  </span>
                  <span className="home-task-price">{money(task.budgetCents)}</span>
                  <span className="home-task-arrow"><Icon name="i-arrow-up-right" /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h3>还没有开放任务</h3><p><Link href="/tasks/new">发布第一个任务</Link>，让合适的人找到你。</p></div>
          )}
          <div className="home-see-all"><Link className="explore-link" href="/tasks">全部 {tasks.length} 个开放任务<Icon name="i-arrow-right" /></Link></div>
        </section>

        <section className="home-section home-academy" aria-labelledby="homeAcademyTitle" style={{ marginTop: 104 }}>
          <div className="home-academy-copy">
            <div className="home-section-kicker">QIONGZHI ACADEMY / COHORT 07</div>
            <h2 id="homeAcademyTitle">学会用 AI，<br /><span>更像一个方法。</span></h2>
          </div>
          <div className="home-academy-body">
            <p>不追逐每一个新工具，而是建立一套可以迁移的工作方法。从提示词、工作流到真实项目，和 12,860 位实践者一起，把知识用起来。</p>
            <div className="home-academy-stats"><div><b>86</b><span>实践课程</span></div><div><b>1,280</b><span>本期共学</span></div><div><b>4.9</b><span>课程评分</span></div></div>
            <Link className="explore-link" href="/learn">进入学习中心<Icon name="i-arrow-right" /></Link>
          </div>
          <div className="home-academy-mark" aria-hidden="true">A</div>
        </section>

        <section className="home-final" aria-labelledby="homeFinalTitle">
          <div className="home-final-copy">
            <div className="home-section-kicker">READY WHEN YOU ARE</div>
            <h2 id="homeFinalTitle">把下一个想法，<br /><span>变成可以交付的事。</span></h2>
            <p>无论你想分享一个方法、找到一位合作者，还是接下一个真实项目，这里都有一条可以走通的路。</p>
            <div className="home-final-actions">
              <Link className="btn btn-dark" href="/new">发布作品<Icon name="i-arrow-up-right" /></Link>
              <Link className="btn btn-ghost" href="/tasks">浏览任务</Link>
            </div>
          </div>
          <div className="home-final-mark" aria-hidden="true"><span className="home-final-orb" /><Icon name="i-moon" /></div>
        </section>
      </div>
    </div>
  );
}
