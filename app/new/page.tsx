import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CreatePostForm } from "@/components/CreatePostForm";

export const metadata: Metadata = { title: "发布作品" };

export default async function NewPostPage() {
  await requireUser("/new");
  return (
    <div className="page-shell" style={{ maxWidth: 820 }}>
      <Link className="detail-back" href="/">← 返回发现</Link>
      <div className="page-head" style={{ display: "block", marginBottom: 22 }}>
        <div className="page-kicker">PUBLISH / 发布作品</div>
        <h1 style={{ maxWidth: 700 }}>分享你的实践，<br /><span style={{ color: "var(--muted)" }}>让它成为别人的方法。</span></h1>
        <p style={{ marginTop: 12, maxWidth: 520 }}>作品、复盘、提问都可以。越具体，越容易被看见，也越容易找到合作者。</p>
      </div>
      <CreatePostForm />
    </div>
  );
}
