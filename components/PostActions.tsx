"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Comment } from "@/lib/data";
import { compact, timeAgo } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

type Props = {
  postId: string;
  title: string;
  initialLiked?: boolean;
  initialSaved?: boolean;
  initialLikes: number;
  initialComments: number;
  isAuthenticated: boolean;
  variant?: "hero" | "card" | "post";
  compactLabels?: boolean;
};

export function PostActions({
  postId,
  title,
  initialLiked = false,
  initialSaved = false,
  initialLikes,
  initialComments,
  isAuthenticated,
  variant = "hero",
  compactLabels = false,
}: Props) {
  const pathname = usePathname() || "/";
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!commentsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCommentsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [commentsOpen]);

  function login() {
    window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
  }

  async function toggleLike() {
    if (!isAuthenticated) return login();
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((value) => value + (nextLiked ? 1 : -1));
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.status === 401) return login();
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikes(data.likeCount);
    } catch {
      setLiked(!nextLiked);
      setLikes((value) => value + (nextLiked ? -1 : 1));
    }
  }

  async function toggleSave() {
    if (!isAuthenticated) return login();
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/posts/${postId}/save`, { method: "POST" });
      if (res.status === 401) return login();
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSaved(data.saved);
    } catch {
      setSaved(!next);
    }
  }

  async function openComments() {
    setCommentsOpen(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      setError("讨论加载失败，请稍后再试。");
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentBody.trim()) return;
    if (!isAuthenticated) return login();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      const data = await res.json();
      if (res.status === 401) return login();
      if (!res.ok) throw new Error(data.error || "发送失败");
      setComments((items) => [...items, data.comment]);
      setCommentCount(data.commentCount);
      setCommentBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setLoading(false);
    }
  }

  const actionClass = variant === "card" ? "showcase-mini-action" : variant === "post" ? "post-action" : "showcase-action";
  const iconClass = "icon";
  const modal = (
    <div className={`modal-layer ${commentsOpen ? "open" : ""}`} aria-hidden={!commentsOpen} role="dialog" aria-modal="true" aria-label="讨论">
      <button className="modal-backdrop" type="button" aria-label="关闭" onClick={() => setCommentsOpen(false)} />
      <div className="modal-panel wide">
        <div className="modal-head">
          <div className="modal-head-copy">
            <div className="eyebrow">DISCUSSION / 讨论</div>
            <h2>{title.slice(0, 28)}</h2>
            <p>保持具体、友善，也允许不同的方法存在。</p>
          </div>
          <button className="modal-close" type="button" onClick={() => setCommentsOpen(false)} aria-label="关闭"><Icon name="i-x" /></button>
        </div>
        <div className="modal-body">
          <div className="modal-summary">
            <Avatar name="此见社区" size={36} />
            <div><b>{title}</b><span>社区讨论 · {commentCount} 条讨论</span></div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="comment-list">
            {comments.length ? comments.map((comment) => (
              <div className="comment-item" key={comment.id}>
                <Avatar name={comment.author.name} handle={comment.author.handle} url={comment.author.avatarUrl} size={31} />
                <div className="comment-copy">
                  <div className="comment-head"><b>{comment.author.name}</b><span>{timeAgo(comment.createdAt)}</span></div>
                  <p>{comment.body}</p>
                </div>
              </div>
            )) : <p className="login-to-comment">还没有讨论，来写下第一条。</p>}
          </div>
          {isAuthenticated ? (
            <form className="comment-compose" onSubmit={submitComment}>
              <input value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="写下你的方法、补充或不同看法…" maxLength={1000} />
              <button className="btn btn-dark btn-sm" type="submit" disabled={loading}>{loading ? "发送中" : "发送"}</button>
            </form>
          ) : (
            <p className="login-to-comment"><Link href={`/login?next=${encodeURIComponent(pathname)}`}>登录</Link> 后参与讨论。</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={variant === "card" ? "showcase-card-foot" : variant === "post" ? "post-foot" : "showcase-actions"}>
        <button className={`${actionClass} ${liked ? "liked" : ""}`} type="button" aria-pressed={liked} onClick={toggleLike}>
          <Icon name="i-heart" className={iconClass} />
          <span>{compact(likes)}</span>
        </button>
        <button className={`${actionClass} ${variant === "hero" ? "js-comment" : ""}`} type="button" onClick={openComments}>
          <Icon name="i-comment" className={iconClass} />
          <span>{compactLabels ? "讨论" : compact(commentCount)}</span>
        </button>
        <button className={`${actionClass} ${saved ? "saved" : ""}`} type="button" aria-pressed={saved} aria-label="收藏" onClick={toggleSave}>
          <Icon name="i-bookmark" className={iconClass} />
          {variant === "hero" && <span>收藏</span>}
        </button>
      </div>
      {commentsOpen && mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
