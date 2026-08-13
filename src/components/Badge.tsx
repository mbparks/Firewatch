import type { ReactNode } from 'react';
export default function Badge({children,tone='neutral'}:{children:ReactNode;tone?:'ok'|'watch'|'danger'|'info'|'neutral'}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
