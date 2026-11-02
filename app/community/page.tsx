import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getLatestPosts, getFeaturedPosts } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { PostActions } from "@/components/PostActions";

export const metadata: Metadata = { title: "社区" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const user = await getSessionUser();
  const posts = await getLatestPosts(user?.id, 20);
  return (
    <div className="community-page">
      <div className="page-head">
        <div>
          <div className="page-kicker">COMMUNITY / OPEN DISCUSSIONS</div>
          <h1>社区正在发生</h1>
        </div>
        <div>
          <p>精选之外，所有实践、复盘与提问在这里继续。保持具体，也允许不同的方法存在。</p>
          <Link className="explore-link" href="/new" style={{ marginTop: 12 }}>发布你的实践<Icon name="i-arrow-up-right" /></Link>
        </div>
      </div>
      {posts.length ? (
        <div className="community-feed">
          {posts.map((post) => (
            <article className="community-post" key={post.id}>
              <div className="post-head" style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Avatar name={post.author.name} handle={post.author.handle} url={post.author.avatarUrl} size={34} />
                <div>
                  <div className="post-name-line"><span className="post-name">{post.author.name}</span><span className="post-role">{post.author.bio.slice(0, 30)}</span></div>
                  <div className="post-meta"><span>{timeAgo(post.createdAt)}</span><span className="meta-chip">{post.type}</span></div>
                </div>
              </div>
              <h2><Link href={`/p/${post.id}`}>{post.title}</Link></h2>
              <p>{post.body}</p>
              <div className="post-tags">{post.tags.map((tag) => <span className="tag" key={tag}># {tag}</span>)}</div>
              <PostActions postId={post.id} title={post.title} initialLiked={post.liked} initialSaved={post.saved} initialLikes={post.likeCount} initialComments={post.commentCount} isAuthenticated={Boolean(user)} variant="post" />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><h3>还没有讨论</h3><p>去发布第一个实践或问题。</p><Link className="btn btn-dark btn-sm" href="/new" style={{ marginTop: 14 }}>发布作品</Link></div>
      )}
    </div>
  );
}
