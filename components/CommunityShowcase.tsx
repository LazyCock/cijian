import Link from "next/link";
import type { Post } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { PostActions } from "./PostActions";

function excerpt(value: string, length = 100) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function coverTitle(value: string) {
  const inside = value.match(/《([^》]+)》/);
  if (inside) return inside[1];
  return value.split(/[：:]/)[0].trim().slice(0, 14);
}

function FilmArt() {
  return (
    <div className="showcase-film" aria-hidden="true">
      <span className="showcase-stars" />
      <span className="showcase-moon" />
      <span className="showcase-haze" />
      <span className="showcase-ridge r1" />
      <span className="showcase-ridge r2" />
      <span className="showcase-ridge r3" />
      <span className="showcase-ridge r4" />
      <span className="showcase-grain" />
      <span className="showcase-scan" />
    </div>
  );
}

function CardArt({ post }: { post: Post }) {
  if (post.cover === "brand") {
    return (
      <div className="showcase-card-art brand-art" aria-hidden="true">
        <div className="sc-brand-main">
          <div className="sc-brand-top"><span>QIONGZHI®</span><span>SELECTED / 2026</span></div>
          <b>{post.title.slice(0, 1)}</b>
          <div className="sc-brand-bottom"><span>{post.tags[0] || "品牌视觉"}</span><small>BRAND SYSTEM / 01</small></div>
        </div>
        <div className="sc-brand-side">
          <span>MOOD / PALETTE</span>
          <div className="sc-swatches"><i /><i /><i /><i /></div>
          <strong>把品味<br />变成<br /><em>方法。</em></strong>
        </div>
        <span className="showcase-card-no">02</span>
      </div>
    );
  }
  if (post.cover === "prompt") {
    return (
      <div className="showcase-card-art prompt-art" aria-hidden="true">
        <div className="sc-code-head"><span>structured_output.prompt</span><span>● LIVE</span></div>
        <div className="sc-code-lines">
          <div><em>01</em><b>角色</b><span>// 严格的数据整理员</span></div>
          <div><em>02</em><b>边界</b><span>只输出 <strong>JSON</strong>，不解释</span></div>
          <div><em>03</em><b>结构</b><span>{"{ title, tags, confidence }"}</span></div>
          <div><em>04</em><b>校验</b><span>失败只返回 error</span></div>
        </div>
        <div className="sc-code-result"><span>2,400 CALLS</span><b>0.8% FAILURE</b></div>
        <span className="showcase-card-no">03</span>
      </div>
    );
  }
  if (post.cover === "question") {
    return (
      <div className="showcase-card-art question-art" aria-hidden="true">
        <span className="sc-qmark">?</span>
        <p>“{excerpt(post.body, 40)}”</p>
        <div className="sc-qmeta">
          <Avatar name={post.author.name} handle={post.author.handle} url={post.author.avatarUrl} size={24} />
          <div><b>{post.author.name}</b><span>{post.tags[0] || "开放提问"}</span></div>
        </div>
        <span className="showcase-card-no">04</span>
      </div>
    );
  }
  return (
    <div className="showcase-card-art" aria-hidden="true">
      <FilmArt />
      <span className="showcase-card-no">05</span>
    </div>
  );
}

export function CommunityShowcase({ posts, isAuthenticated }: { posts: Post[]; isAuthenticated: boolean }) {
  if (!posts.length) {
    return (
      <section className="community-showcase">
        <div className="showcase-inner">
          <div className="showcase-rule"><span>COMMUNITY / SELECTED WORKS</span><span>VOL. 07 · 2026</span></div>
          <div className="empty-state" style={{ marginTop: 30 }}>
            <h3>本期精选正在准备中</h3>
            <p>先发布一件作品，成为下一期封面。</p>
          </div>
        </div>
      </section>
    );
  }
  const lead = posts.find((post) => post.cover === "film") || posts[0];
  const cards = posts.filter((post) => post.id !== lead.id).slice(0, 3);

  return (
    <section className="community-showcase" aria-labelledby="communityTitle">
      <div className="showcase-inner">
        <header className="showcase-head">
          <div className="showcase-rule"><span>COMMUNITY / SELECTED WORKS</span><span>VOL. 07 · 2026</span></div>
          <div className="showcase-head-main">
            <h2 id="communityTitle">社区精选<span>.</span></h2>
            <div className="showcase-head-copy">
              <p>不按发布时间排序。只选那些让人停下来的实践。</p>
              <div className="showcase-head-meta"><span>{String(posts.length).padStart(2, "0")} 件作品</span><span>12,860 位实践者</span><span>每周五更新</span></div>
            </div>
          </div>
        </header>

        <article className="showcase-feature" aria-label={`本期封面：${lead.title}`}>
          <FilmArt />
          <div className="showcase-feature-top">
            <span className="showcase-chip">本期封面 / 01</span>
            <span className="showcase-runtime">{timeAgo(lead.createdAt)} · {lead.type === "question" ? "OPEN QUESTION" : "SELECTED WORK"}</span>
          </div>
          <div className="showcase-number" aria-hidden="true">01</div>
          <div className="showcase-side" aria-hidden="true"><span>SELECTED<br />WORKS</span><i /><small>07</small></div>
          <Link className="showcase-play" href={`/p/${lead.id}`}>
            <span className="showcase-play-ring"><Icon name="i-arrow-up-right" /></span>
            <span>VIEW WORK</span>
          </Link>
          <div className="showcase-feature-copy">
            <div className="showcase-overline">{lead.cover === "film" ? "BETWEEN MOUNTAINS AND SEA" : "QIONGZHI / SELECTED"}</div>
            <h3><Link href={`/p/${lead.id}`}>{coverTitle(lead.title)}</Link></h3>
            <p>{excerpt(lead.body, 120)}</p>
            <div className="showcase-byline">
              <Avatar name={lead.author.name} handle={lead.author.handle} url={lead.author.avatarUrl} size={30} />
              <div><b>{lead.author.name}</b><span>{lead.author.handle} · 认证创作者</span></div>
              <span className="tag lime" style={{ marginLeft: 8 }}>本期推荐</span>
            </div>
            <div className="showcase-social">
              <PostActions
                postId={lead.id}
                title={lead.title}
                initialLiked={lead.liked}
                initialSaved={lead.saved}
                initialLikes={lead.likeCount}
                initialComments={lead.commentCount}
                isAuthenticated={isAuthenticated}
                variant="hero"
              />
            </div>
          </div>
        </article>

        <div className="showcase-marquee" aria-hidden="true">
          <div className="showcase-marquee-track">
            {[...posts, ...posts].map((post, index) => (
              <span key={`${post.id}-${index}`}>
                {post.title.split("：")[0]}
                <i> / {post.type.toUpperCase()} / {post.author.name} / {post.likeCount} LIKES</i>
              </span>
            ))}
          </div>
        </div>

        <div className="showcase-grid">
          {cards.map((post) => (
            <article className="showcase-card" key={post.id}>
              <CardArt post={post} />
              <div className="showcase-card-copy">
                <span className="showcase-card-kicker">{post.cover === "brand" ? "BRAND SYSTEM" : post.cover === "prompt" ? "PROMPT SYSTEM" : "OPEN QUESTION"} / {post.author.name}</span>
                <h3><Link href={`/p/${post.id}`}>{post.title.split("：")[0]}</Link></h3>
                <p>{excerpt(post.body, 66)}</p>
                <PostActions
                  postId={post.id}
                  title={post.title}
                  initialLiked={post.liked}
                  initialSaved={post.saved}
                  initialLikes={post.likeCount}
                  initialComments={post.commentCount}
                  isAuthenticated={isAuthenticated}
                  variant="card"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="showcase-footnote">
          <span>CURATED EVERY FRIDAY / BY QIONGZHI COMMUNITY</span>
          <span>看到值得被看见的实践？</span>
          <Link href="/new">投稿 <Icon name="i-arrow-up-right" /></Link>
        </div>
      </div>
    </section>
  );
}
