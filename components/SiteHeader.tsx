"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";

type HeaderUser = {
  name: string;
  handle: string;
  avatarUrl: string | null;
  role: "user" | "admin";
};

const nav = [
  ["/", "发现"],
  ["/tasks", "任务广场"],
  ["/learn", "学习中心"],
  ["/workspace", "工作台"],
] as const;

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
        <div className="topbar-inner">
          <Link className="brand" href="/" aria-label="穹智首页">
            <span className="logo-mark"><Icon name="i-moon" /></span>
            <span className="brand-copy"><span className="brand-name">穹智</span><span className="brand-en">QIONGZHI</span></span>
          </Link>

          <nav className="main-nav" aria-label="主导航">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={`nav-link ${active(href) ? "active" : ""}`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="top-actions">
            <Link className="icon-btn" href="/search" aria-label="搜索"><Icon name="i-search" /></Link>
            <Link className="icon-btn" href={user ? "/workspace" : "/login"} aria-label="通知"><Icon name="i-bell" /></Link>
            <ThemeToggle />
            <Link className="btn btn-dark top-publish" href="/new">
              <Icon name="i-plus" />发布作品
            </Link>
            {user ? (
              <div className="account-menu-wrap" ref={menuRef}>
                <button
                  className="profile-btn"
                  type="button"
                  aria-label="打开个人菜单"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <Avatar name={user.name} handle={user.handle} url={user.avatarUrl} size={32} />
                </button>
                {menuOpen ? (
                  <div className="account-menu open">
                    <div className="account-menu-head">
                      <Avatar name={user.name} handle={user.handle} url={user.avatarUrl} size={37} />
                      <div className="account-menu-copy"><b>{user.name}</b><span>@{user.handle}</span></div>
                      <span className="tag lime" style={{ padding: "2px 6px", fontSize: 7.5 }}>在线</span>
                    </div>
                    <Link className="account-menu-item" href={`/u/${user.handle}`}><Icon name="i-home" />个人主页<span className="shortcut">→</span></Link>
                    <Link className="account-menu-item" href="/workspace"><Icon name="i-briefcase" />我的协作</Link>
                    <Link className="account-menu-item" href="/new"><Icon name="i-edit" />发布作品</Link>
                    <div className="account-menu-sep" />
                    <Link className="account-menu-item" href="/settings"><Icon name="i-layers" />账号设置</Link>
                    <button className="account-menu-item" type="button" onClick={logout}><Icon name="i-x" />退出登录</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link className="btn btn-light login-link" href="/login">登录</Link>
            )}
          </div>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="移动端导航">
        <div className="mobile-nav-inner">
          <Link className={pathname === "/" ? "active" : ""} href="/" aria-label="发现"><Icon name="i-compass" />发现</Link>
          <Link className={active("/tasks") ? "active" : ""} href="/tasks" aria-label="任务"><Icon name="i-briefcase" />任务</Link>
          <Link className="mobile-publish" href="/new" aria-label="发布作品"><Icon name="i-plus" /></Link>
          <Link className={active("/workspace") ? "active" : ""} href="/workspace" aria-label="工作台"><Icon name="i-briefcase" />工作台</Link>
          <Link className={active("/learn") ? "active" : ""} href="/learn" aria-label="学习"><Icon name="i-book" />学习</Link>
        </div>
      </nav>
    </>
  );
}
