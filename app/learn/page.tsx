import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "学习中心" };

const tracks = [
  { week: "入门 · 7 天", title: "AI 工作方法入门", desc: "从“会聊天”到“会交付”：提示词结构、信息整理与结果校验。", lessons: "12 节课", people: "3.2k 人" },
  { week: "进阶 · 14 天", title: "Agent 工作流实战", desc: "从一个真实需求出发，搭建可交付、可复用、可维护的 Agent。", lessons: "18 节课", people: "1.8k 人" },
  { week: "创作 · 10 天", title: "AI 影像叙事课", desc: "从分镜、角色一致性到声音设计，完成一支属于你的 AI 短片。", lessons: "15 节课", people: "2.6k 人" },
];

export default function LearnPage() {
  return (
    <div className="wide-shell">
      <section className="learn-hero">
        <div className="learn-copy">
          <div className="eyebrow">CIJIAN ACADEMY / 学习中心</div>
          <h1>学会用 AI，<br /><span>更像一个方法。</span></h1>
          <p>不追逐每一个新工具，而是建立一套可以迁移的工作方法。从提示词、工作流到真实项目，和 12,860 位实践者一起，把知识用起来。</p>
          <form className="learn-search" action="/search" method="get">
            <Icon name="i-search" />
            <input name="q" placeholder="搜索课程、工作流或讲师…" aria-label="搜索课程" />
            <button className="btn btn-lime" type="submit">搜索</button>
          </form>
          <div className="learn-stats"><div className="learn-stat"><b>86</b><span>门实践课程</span></div><div className="learn-stat"><b>1,280</b><span>本期共学同学</span></div><div className="learn-stat"><b>4.9</b><span>平均课程评分</span></div></div>
        </div>
        <div className="learn-stage" aria-hidden="true">
          <div className="course-poster">
            <div className="poster-brand"><span>CIJIAN ACADEMY®</span><span>2026 / SPRING</span></div>
            <h3>让 AI<br />成为你的<br /><em>工作方法。</em></h3>
            <div className="poster-sub">FROM PROMPT TO DELIVERY</div>
            <div className="poster-bottom"><span>07 DAYS</span><b>1,280 LEARNERS</b></div>
          </div>
          <span className="poster-tag"><Icon name="i-bolt" />今晚 20:00 开课</span>
        </div>
      </section>

      <section className="learn-section">
        <div className="section-heading">
          <div><div className="page-kicker">LEARNING PATHS / 学习路径</div><h2>选择你的路径</h2><p>从你此刻真正想解决的问题出发。</p></div>
          <Link className="explore-link" href="/tasks">从项目中学习<Icon name="i-arrow-right" /></Link>
        </div>
        <div className="track-grid">
          {tracks.map((track, index) => (
            <article className="track-card" key={track.title}>
              <div className="track-top"><span className="tag outline">{track.week}</span><span className="track-index">{String(index + 1).padStart(2, "0")}</span></div>
              <h3>{track.title}</h3>
              <p>{track.desc}</p>
              <div className="track-foot"><span>{track.lessons} · {track.people}</span><Link className="track-arrow" href="/login?next=/learn" aria-label={`了解${track.title}`}><Icon name="i-arrow-up-right" /></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="learn-section">
        <div className="section-heading"><div><div className="page-kicker">THIS WEEK / 本周共学</div><h2>接下来发生</h2></div><span className="schedule-range">03.24 — 03.30</span></div>
        <div className="learning-grid">
          <div className="schedule-card">
            <div className="schedule-head"><h3>本周共学日历</h3><span>直播 · 工作坊</span></div>
            {[
              ["24", "周一", "直播 · 一套 Prompt 系统的 4 个层次", "20:00 - 21:30 · 鹿鸣"],
              ["26", "周三", "工作坊 · 用 ComfyUI 锁定角色一致性", "19:30 - 21:00 · 一颗桃"],
              ["28", "周五", "直播 · 从作品集到可交付的服务", "20:00 - 21:30 · 林小满"],
            ].map(([day, week, title, time]) => (
              <div className="schedule-row" key={day}>
                <div className="schedule-date"><b>{day}</b><span>{week}</span></div>
                <div className="schedule-info"><b>{title}</b><span>{time}</span></div>
                <Link className="btn btn-light btn-sm" href="/login?next=/learn">预约</Link>
              </div>
            ))}
          </div>
          <section className="learn-community">
            <div className="eyebrow">COMMUNITY LEARNING / 共学</div>
            <h3>一个人学得快，<br />一群人走得远。</h3>
            <p>加入同城或同主题学习小组，每周一次线上共创，把课程练习变成真实作品。</p>
            <Link className="btn btn-dark btn-sm" href="/register?next=/learn">加入本期共学<Icon name="i-arrow-up-right" /></Link>
          </section>
        </div>
      </section>
    </div>
  );
}
