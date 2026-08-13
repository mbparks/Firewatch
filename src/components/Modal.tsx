import type { ReactNode } from 'react';
export default function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">×</button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>
}
