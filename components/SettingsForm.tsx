"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsForm({ user }: { user: { name: string; bio: string; location: string; website: string } }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [website, setWebsite] = useState(user.website);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, location, website }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("网络暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="field"><label htmlFor="settings-name">名字</label><input id="settings-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required /></div>
      <div className="field"><label htmlFor="settings-bio">介绍 <span>你正在做什么、能交付什么</span></label><textarea id="settings-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={600} /></div>
      <div className="form-row">
        <div className="field"><label htmlFor="settings-location">所在城市</label><input id="settings-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} /></div>
        <div className="field"><label htmlFor="settings-website">主页 / 作品集</label><input id="settings-website" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={160} placeholder="your.site" /></div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {saved && <p className="form-help" style={{ color: "var(--accent)" }}>资料已保存。</p>}
      <div className="form-actions"><button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "保存中…" : "保存资料"}</button><span className="form-help">这些信息会出现在你的公开主页。</span></div>
    </form>
  );
}
