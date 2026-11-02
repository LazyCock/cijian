import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { compact } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { Icon } from "@/components/Icon";
import { PostCover } from "@/components/PostCover";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  return { title: profile ? `${profile.name} (@${profile.handle})` : "个人主页" };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const viewer = await getSessionUser();
  const profile = await getProfile(handle, viewer?.id);
  if (!profile) notFound();
  const isOwn = viewer?.handle === profile.handle;
  const joined = new Date(profile.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long" });

  return (
    <div className="profile-page">
      <section className="profile-cover">
        <div className="profile-orb" aria-hidden="true" />
        <div className="profile-orbit" aria-hidden="true" />
        <div className="profile-topline"><span>PROFILE / 个人主页</span><span>QIONGZHI ID · {profile.id.slice(0, 5).toUpperCase()} · {profile.location}</span></div>
        <div className="profile-identity">
          <span className="profile-avatar"><Avatar name={profile.name} handle={profile.handle} url={profile.avatarUrl} size={82} /></span>
          <div className="profile-copy">
            <div className="profile-kicker"><span className="tag">AI 应用探索者</span><span className="tag">Lv.4</span><span className="tag">可接单</span></div>
            <div className="profile-name-row"><h1>{profile.name}</h1><span className="verified" aria-label="认证创作者"><Icon name="i-check" /></span></div>
            <div className="profile-handle">@{profile.handle} · 创作者编号 {profile.id.slice(0, 5).toUpperCase()}</div>
            <p className="profile-bio">{profile.bio}</p>
            <div className="profile-meta-row">
              <span><Icon name="i-target" />{profile.location}</span>
              {profile.website && <span><Icon name="i-link" />{profile.website}</span>}
              <span><Icon name="i-calendar" />{joined}加入</span>
            </div>
          </div>
          <div className="profile-actions">
            {isOwn ? <Link className="btn btn-light" href="/settings"><Icon name="i-edit" />编辑资料</Link> : <FollowButton handle={profile.handle} initialFollowing={profile.following} isAuthenticated={Boolean(viewer)} />}
          </div>
        </div>
        <div className="profile-stat-strip">
          <div className="profile-stat"><b>{profile.stats.posts}</b><span>公开作品</span></div>
          <div className="profile-stat"><b>{compact(profile.stats.followers)}</b><span>粉丝</span></div>
          <div className="profile-stat"><b>{compact(profile.stats.following)}</b><span>关注</span></div>
          <div className="profile-stat"><b>{compact(profile.stats.likes)}</b><span>获赞</span></div>
          <div className="profile-stat"><b>4.9</b><span>合作评分</span></div>
        </div>
      </section>

      <div className="profile-tabs" role="tablist" aria-label="个人主页内容">
        <span className="profile-tab active" role="tab" aria-selected="true">作品<span className="count">{profile.stats.posts}</span></span>
        <a className="profile-tab" href="#about">关于</a>
      </div>

      <div className="profile-tab-panel active">
        <div className="profile-section-head">
          <div><h2>精选作品</h2><p>让方法被看见，也让合作方知道你能交付什么。</p></div>
          {isOwn && <Link className="btn btn-dark btn-sm" href="/new"><Icon name="i-plus" />发布新作品</Link>}
        </div>
        {profile.posts.length ? (
          <div className="profile-work-grid">
            {profile.posts.map((post) => (
              <Link className="profile-work-card" href={`/p/${post.id}`} key={post.id}>
                <PostCover post={post} />
                <div className="profile-work-body">
                  <h3>{post.title}</h3>
                  <div className="profile-work-foot"><span className="type">{post.tags[0] || post.type}</span><span><i><Icon name="i-heart" />{compact(post.likeCount)}</i><i><Icon name="i-comment" />{post.commentCount}</i></span></div>
                </div>
              </Link>
            ))}
          </div>
        ) : <div className="profile-empty">还没有公开作品。{isOwn && <Link href="/new">发布第一件作品 →</Link>}</div>}
      </div>

      <section id="about" className="profile-detail-about">
        <div className="page-kicker">ABOUT / 关于</div>
        <h2>正在做的事</h2>
        <p>{profile.bio}</p>
        <div className="profile-about-stat-line"><span>公开作品 <b>{profile.stats.posts}</b></span><span>获得喜欢 <b>{profile.stats.likes}</b></span><span>加入时间 <b>{joined}</b></span></div>
      </section>
    </div>
  );
}
