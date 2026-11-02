import type { Post } from "@/lib/data";

const labels: Record<string, string> = {
  film: "AI FILM / 2026",
  brand: "BRAND IDENTITY / 2026",
  prompt: "PROMPT SYSTEM / 2026",
  question: "OPEN QUESTION / 2026",
};

export function PostCover({ post }: { post: Post }) {
  const mark = post.title.replace(/[·：:].*$/, "").slice(0, 1);
  if (post.cover === "prompt") {
    return (
      <div className="profile-work-cover cover-agent">
        <span className="node n1" /><span className="node n2" /><span className="node n3" />
        <span className="linkline l1" /><span className="linkline l2" />
        <span className="cover-kicker">{labels[post.cover]}</span>
        <span className="cover-title">{post.title.split("：")[0].slice(0, 12)}</span>
        <span className="cover-mark">{mark}</span>
        <span className="cover-meta">CIJIAN / SELECTED</span>
      </div>
    );
  }
  return (
    <div className={`profile-work-cover cover-${post.cover}`}>
      <span className="cover-kicker">{labels[post.cover]}</span>
      <span className="cover-title">{post.title.split("：")[0].slice(0, 12)}</span>
      <span className="cover-mark">{mark}</span>
      <span className="cover-meta">CIJIAN / SELECTED</span>
    </div>
  );
}
