export const nowIso = () => new Date().toISOString();
export const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const minutesAgo = (iso?: string) => {
  if (!iso) return Infinity;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
};
