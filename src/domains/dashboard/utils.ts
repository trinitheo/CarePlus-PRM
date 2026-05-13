
export function timeAgo(ts: any): string {
  if (!ts) return '';
  const ms = ts?.seconds ? ts.seconds * 1000 : Number(ts);
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function urgencyPill(p: string) {
  if (p === 'urgent' || p === 'immediate') return 'bg-red-50 text-red-700 border border-red-200';
  if (p === 'soon') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}
