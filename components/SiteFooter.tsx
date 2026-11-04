import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="logo-mark"><BrandMark /></span>
        <span>此见 CIJIAN · AI 应用与协作社区</span>
      </div>
      <div className="footer-links">
        <Link href="/">关于</Link>
        <Link href="/learn">学院</Link>
        <Link href="/tasks">任务广场</Link>
        <Link href="/workspace">工作台</Link>
        <a href="/api/health" target="_blank" rel="noreferrer">服务状态</a>
      </div>
    </footer>
  );
}
