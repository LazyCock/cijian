import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata: Metadata = { title: "账号设置" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <div className="page-shell" style={{ maxWidth: 780 }}>
      <Link className="detail-back" href={`/u/${user.handle}`}>← 返回个人主页</Link>
      <div className="page-head" style={{ display: "block", marginBottom: 22 }}>
        <div className="page-kicker">ACCOUNT / 账号设置</div>
        <h1 style={{ fontSize: 44 }}>让别人知道<br /><span style={{ color: "var(--muted)" }}>你能交付什么。</span></h1>
      </div>
      <SettingsForm user={{ name: user.name, bio: user.bio, location: user.location, website: user.website }} />
    </div>
  );
}
