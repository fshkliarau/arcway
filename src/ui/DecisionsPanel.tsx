import { useLayoutEffect, useRef, type CSSProperties, type FocusEvent } from 'react';
import { EARLIER, money, signed, type Decision, type DecisionId } from '../decisions';
import { ArrowRight, CheckIcon, ChevronRight, ChevronSmall, CloseIcon, FilterIcon, WarningIcon } from './icons';

type Props = {
  decisions: Decision[]; read: ReadonlySet<DecisionId>; previewing: DecisionId | null; hidden: boolean;
  totals: { before: number; now: number };
  onCardEnter: (id: DecisionId) => void; onCardLeave: (id: DecisionId) => void;
  onPreview: (id: DecisionId | null) => void; onReplace: () => void; onClose: () => void;
};

export const Swatch = ({ style, photo }: { style: CSSProperties; photo?: string }) =>
  <span className={`swatch ${photo ? 'photo' : ''}`} style={photo ? { backgroundImage: `url(${photo})` } : style} />;

// Decision log for the current room. Hovering a card frames that part of the
// kitchen and marks it read; hovering the previous choice previews it in 3D.
export default function DecisionsPanel({ decisions, read, previewing, hidden, totals, onCardEnter, onCardLeave, onPreview, onReplace, onClose }: Props) {
  const body = useRef<HTMLDivElement>(null), scroll = useRef(0);
  // Returning from the Replace flow restores where the list was.
  useLayoutEffect(() => { if (!hidden && body.current) body.current.scrollTop = scroll.current; }, [hidden]);
  const unread = decisions.filter(d => !read.has(d.id)).length;
  const atRisk = decisions.filter(d => d.issue).length;
  const leaveIfOutside = (id: DecisionId) => (e: FocusEvent<HTMLElement>) => { if (!e.currentTarget.contains(e.relatedTarget)) onCardLeave(id); };

  return <section className="panel" aria-label="Decisions" hidden={hidden}>
    <div className="panel-header">
      <h2 className="panel-title">Decisions</h2>
      <div className="header-actions">
        <button className="icon-button" aria-label="Filter decisions"><FilterIcon /></button>
        <button className="icon-button" aria-label="Close decisions" onClick={onClose}><CloseIcon /></button>
      </div>
    </div>
    <div className="panel-body" ref={body} onScroll={e => { scroll.current = e.currentTarget.scrollTop; }}>
      <div className="card summary">
        <div className="summary-since">Since Mon, 4:12 PM</div>
        <div className="summary-estimate">
          <div className="figure"><span className="figure-label">Before</span><span className="figure-value num">{money(totals.before)}</span></div>
          <ArrowRight />
          <div className="figure now"><span className="figure-label">Now</span><span className="figure-value num">{money(totals.now)}</span></div>
          <span className="delta-badge num">{signed(totals.now - totals.before)}</span>
        </div>
        <div className="summary-stats">
          {unread > 0 && <span className="stat">{unread} new in Kitchen</span>}
          {atRisk > 0 && <span className="stat risk">{atRisk} at risk for deadline</span>}
          {!unread && !atRisk && <span className="stat calm">All Kitchen changes reviewed</span>}
        </div>
      </div>

      <div className="section-head">
        <h3 className="section-title">Kitchen</h3>
        {unread > 0 && <span className="section-meta">{unread} new</span>}
      </div>

      {decisions.map(d => <article key={d.id} className={`card decision ${read.has(d.id) ? 'read' : ''}`} tabIndex={0}
        aria-label={`${d.title}: ${d.before.label} to ${d.after.label}, ${signed(d.delta)}${read.has(d.id) ? '' : ', new'}`}
        onPointerEnter={() => onCardEnter(d.id)} onPointerLeave={() => onCardLeave(d.id)}
        onFocus={() => onCardEnter(d.id)} onBlur={leaveIfOutside(d.id)}>
        <div className="decision-title">
          <span className="decision-dot" aria-hidden="true" />
          <span className="decision-name">{d.title}</span>
          <span className="decision-meta">{d.author} · {d.time}</span>
          <span className="decision-delta num">{signed(d.delta)}</span>
        </div>
        <div className="compare">
          <button className={`chip before ${previewing === d.id ? 'previewing' : ''}`} aria-label={`Preview previous choice, ${d.before.label}, in 3D`}
            onPointerEnter={() => onPreview(d.id)} onPointerLeave={() => onPreview(null)} onFocus={() => onPreview(d.id)} onBlur={() => onPreview(null)}>
            <Swatch style={d.before.swatch} photo={d.before.photo} /><span className="chip-label">{d.before.label}</span>
          </button>
          <ChevronSmall />
          <div className={`chip after ${d.issue ? 'at-risk' : ''}`}>
            <Swatch style={d.after.swatch} photo={d.after.photo} /><span className="chip-label">{d.after.label}</span>
          </div>
        </div>
        {d.issue && <div className="issue">
          <WarningIcon /><span className="issue-text">{d.issue.message}</span>
          <button className="dark-button" onClick={onReplace}>{d.issue.action}</button>
        </div>}
        {d.resolved && <div className="resolved"><CheckIcon />{d.resolved}</div>}
      </article>)}

      <div className="earlier-wrap">
        <button className="earlier">
          <span><span className="earlier-title" style={{ display: 'block' }}>Earlier</span><span className="earlier-sub">{EARLIER.count} decisions · {EARLIER.rooms}</span></span>
          <span className="earlier-end"><span className="num">{signed(EARLIER.delta)}</span><ChevronRight /></span>
        </button>
      </div>
    </div>
  </section>;
}
