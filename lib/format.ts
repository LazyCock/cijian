export function money(cents: number) {
  return `¥${Math.round(cents / 100).toLocaleString("zh-CN")}`;
}

export function compact(value: number) {
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace(/\.0$/, "")}w`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export function timeAgo(iso: string) {
  const time = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  if (days <= 0) return "今天截止";
  return `剩余 ${days} 天`;
}

export function statusLabel(status: string) {
  return (
    {
      open: "招募中",
      in_progress: "进行中",
      submitted: "待验收",
      completed: "已完成",
      cancelled: "已取消",
      pending: "已申请",
      accepted: "已接单",
      rejected: "未通过",
      withdrawn: "已撤回",
    }[status] || status
  );
}
