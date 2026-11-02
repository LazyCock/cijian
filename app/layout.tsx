import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IconSprite } from "@/components/IconSprite";

export const metadata: Metadata = {
  title: {
    default: "此见 CIJIAN · AI 应用与协作社区",
    template: "%s · 此见 CIJIAN",
  },
  description: "在真实项目里学习，在公开协作中生长。AI 应用、任务协作与实践社区。",
  applicationName: "此见",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark light",
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('qiongzhi-theme');
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = saved === 'light' || saved === 'dark' ? saved : (prefersLight ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f2f4f8' : '#05070d');
  } catch (error) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <IconSprite />
        <SiteHeader
          user={user ? { name: user.name, handle: user.handle, avatarUrl: user.avatarUrl, role: user.role } : null}
        />
        <main className="app" id="main">{children}</main>
        <SiteFooter />
        <Link className="skip-link" href="#main">跳到主要内容</Link>
      </body>
    </html>
  );
}
