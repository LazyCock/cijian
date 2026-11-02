import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getComments, getPost } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { PostActions } from "@/components/PostActions";
import { PostCover } from "@/components/PostCover";
import { MediaGallery } from "@/components/MediaGallery";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post?.title || "作品" };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const post = await getPost(id, user?.id);
  if (!post) notFound();
  const comments = await getComments(post.id);

  return (
    <div className="detail-shell post-detail-page" style={{ maxWidth: 980 }}>
      <Link className="detail-back" href="/community">← 返回社区</Link>
      <article>
        <div className="post-detail-head">
          <div className="task-detail-tags">
            <span className="tag blue">{post.tags[0] || post.type}</span>
            <span className="tag outline">{timeAgo(post.createdAt)}</span>
            {post.featured && <span className="tag lime">本期精选</span>}
          </div>
          <h1>{post.title}</h1>
          <div className="post-detail-author">
            <Avatar name={post.author.name} handle={post.author.handle} url={post.author.avatarUrl} size={36} />
            <div><b>{post.author.name}</b><span>@{post.author.handle}</span></div>
            <Link className="btn btn-light btn-sm" href={`/u/${post.author.handle}`}>查看主页</Link>
          </div>
        </div>

        <div className="post-detail-cover"><PostCover post={post} /></div>

        {post.media.length > 0 && <MediaGallery items={post.media} />}

        <div className="post-detail-body">
          <p>{post.body}</p>
          <div className="post-tags">{post.tags.map((tag) => <span className="tag" key={tag}># {tag}</span>)}</div>
          <PostActions
            postId={post.id}
            title={post.title}
            initialLiked={post.liked}
            initialSaved={post.saved}
            initialLikes={post.likeCount}
            initialComments={post.commentCount}
            isAuthenticated={Boolean(user)}
            variant="post"
          />
        </div>

        <section className="post-detail-comments">
          <div className="post-detail-comments-head"><h2>讨论 <span>{post.commentCount}</span></h2><span>保持具体、友善</span></div>
          {comments.length ? comments.map((comment) => (
            <div className="comment-item" key={comment.id}>
              <Avatar name={comment.author.name} handle={comment.author.handle} url={comment.author.avatarUrl} size={32} />
              <div className="comment-copy">
                <div className="comment-head"><b>{comment.author.name}</b><span>{timeAgo(comment.createdAt)}</span></div>
                <p>{comment.body}</p>
              </div>
            </div>
          )) : <p className="login-to-comment">还没有讨论。点击上方评论按钮，写下第一条。</p>}
        </section>
      </article>
    </div>
  );
}
