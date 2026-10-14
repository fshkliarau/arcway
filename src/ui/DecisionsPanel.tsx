import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type HTMLAttributes, type ReactNode } from 'react';
import { EARLIER, EARLIER_DECISIONS, ROOMS, money, signed, type Decision, type DecisionId, type LogEntry, type Room } from '../decisions';
import { ArrowRight, CheckIcon, ChevronRight, ChevronSmall, CloseIcon, DoubleCheck, FilterIcon, MenuCheck, WarningIcon } from './icons';

type Props = {
  decisions: Decision[]; read: ReadonlySet<DecisionId>; previewing: DecisionId | null; hidden: boolean;
  totals: { before: number; now: number };
  onCardEnter: (id: DecisionId) => void; onCardLeave: (id: DecisionId) => void;
  onPreview: (id: DecisionId | null) => void; onReplace: () => void; onClose: () => void; onMarkAllSeen: () => void;
};
type RoomFilter = 'all' | Room;
type StatusFilter = 'all' | 'unseen' | 'issue';

export const Swatch = ({ style, photo }: { style: CSSProperties; photo?: string }) =>
  <span className={`swatch ${photo ? 'photo' : ''}`} style={photo ? { backgroundImage: `url(${photo})` } : style} />;

const roomLabel = (r: RoomFilter) => r === 'all' ? 'all rooms' : ROOMS.find(x => x.id === r)!.label;

// Decision log. Hovering a kitchen card frames that part of the kitchen and marks
// it read; hovering the previous choice previews it in 3D. The filter narrows by room and status.
export default function DecisionsPanel({ decisions, read, previewing, hidden, totals, onCardEnter, onCardLeave, onPreview, onReplace, onClose, onMarkAllSeen }: Props) {
  const body = useRef<HTMLDivElement>(null), scroll = useRef(0);
  const [room, setRoom] = useState<RoomFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  // Returning from the Replace flow restores where the list was.
  useLayoutEffect(() => { if (!hidden && body.current) body.current.scrollTop = scroll.current; }, [hidden]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Escape') setMenuOpen(false);
      if (e.shiftKey && e.key.toLowerCase() === 'm' && !typing && !hidden) { onMarkAllSeen(); setMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hidden, onMarkAllSeen]);

  const unread = decisions.filter(d => !read.has(d.id)).length;
  const atRisk = decisions.filter(d => d.issue).length;
  const passes = (seen: boolean, issue: boolean) => status === 'all' || (status === 'unseen' ? !seen : issue);
  const kitchen = room === 'all' || room === 'kitchen' ? decisions.filter(d => passes(read.has(d.id), Boolean(d.issue))) : [];
  const other = room !== 'all' && room !== 'kitchen' ? EARLIER_DECISIONS.filter(e => e.room === room && passes(true, false)) : [];
  const showEarlier = room === 'all' && status === 'all';
  const filtered = room !== 'all' || status !== 'all';
  const leaveIfOutside = (id: DecisionId) => (e: FocusEvent<HTMLElement>) => { if (!e.currentTarget.contains(e.relatedTarget)) onCardLeave(id); };

  return <>
    <section className="panel" aria-label="Decisions" hidden={hidden}>
      <div className="panel-header">
        <h2 className="panel-title">Decisions</h2>
        <div className="header-actions">
          <button className={`icon-button filter-button ${menuOpen || filtered ? 'active' : ''}`} aria-label="Filter decisions"
            aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            <FilterIcon />{filtered && !menuOpen && <span className="filter-dot" aria-hidden="true" />}
          </button>
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

        {kitchen.length > 0 && <>
          <div className="section-head">
            <h3 className="section-title">Kitchen</h3>
            {unread > 0 && <span className="section-meta">{unread} new</span>}
          </div>
          {kitchen.map(d => <Card key={d.id} entry={d} read={read.has(d.id)} previewing={previewing === d.id}
            cardProps={{ onPointerEnter: () => onCardEnter(d.id), onPointerLeave: () => onCardLeave(d.id), onFocus: () => onCardEnter(d.id), onBlur: leaveIfOutside(d.id) }}
            onPreview={on => onPreview(on ? d.id : null)}
            footer={<>
              {d.issue && <div className="issue">
                <WarningIcon /><span className="issue-text">{d.issue.message}</span>
                <button className="dark-button" onClick={onReplace}>{d.issue.action}</button>
              </div>}
              {d.resolved && <div className="resolved"><CheckIcon />{d.resolved}</div>}
            </>} />)}
        </>}

        {other.length > 0 && <>
          <div className="section-head"><h3 className="section-title">{roomLabel(room)}</h3><span className="section-meta">Earlier</span></div>
          {other.map(e => <Card key={e.id} entry={e} read />)}
        </>}

        {showEarlier && <div className="earlier-wrap">
          <button className="earlier">
            <span><span className="earlier-title" style={{ display: 'block' }}>Earlier</span><span className="earlier-sub">{EARLIER.count} decisions · {EARLIER.rooms}</span></span>
            <span className="earlier-end"><span className="num">{signed(EARLIER.delta)}</span><ChevronRight /></span>
          </button>
        </div>}

        {!kitchen.length && !other.length && !showEarlier && <div className="card empty">
          <span>No {status === 'unseen' ? 'unseen changes' : status === 'issue' ? 'changes with an issue' : 'changes'} in {roomLabel(room).replace(/^all rooms$/, 'any room')}</span>
          <button className="text-link" onClick={() => { setRoom('all'); setStatus('all'); }}>Show all changes</button>
        </div>}
      </div>
    </section>
    {menuOpen && !hidden && <FilterMenu room={room} status={status} unseen={unread} issues={atRisk}
      onRoom={r => { setRoom(r); setMenuOpen(false); }} onStatus={s => { setStatus(s); setMenuOpen(false); }}
      onMarkAllSeen={() => { onMarkAllSeen(); setMenuOpen(false); }} onDismiss={() => setMenuOpen(false)} />}
  </>;
}

// One decision: title row, previous → current choice, optional footer.
function Card({ entry, read, previewing = false, cardProps, onPreview, footer }: {
  entry: Decision | LogEntry; read: boolean; previewing?: boolean; footer?: ReactNode;
  cardProps?: HTMLAttributes<HTMLElement>; onPreview?: (on: boolean) => void;
}) {
  const d = entry, issue = 'issue' in d && d.issue, photo = (c: object) => 'photo' in c ? (c as { photo?: string }).photo : undefined;
  return <article className={`card decision ${read ? 'read' : ''}`} tabIndex={cardProps ? 0 : undefined}
    aria-label={`${d.title}: ${d.before.label} to ${d.after.label}, ${signed(d.delta)}${read ? '' : ', new'}`} {...cardProps}>
    <div className="decision-title">
      <span className="decision-dot" aria-hidden="true" />
      <span className="decision-name">{d.title}</span>
      <span className="decision-meta">{d.author} · {d.time}</span>
      <span className="decision-delta num">{signed(d.delta)}</span>
    </div>
    <div className="compare">
      <button className={`chip before ${previewing ? 'previewing' : ''}`} aria-label={onPreview ? `Preview previous choice, ${d.before.label}, in 3D` : `Previous choice, ${d.before.label}`}
        onPointerEnter={() => onPreview?.(true)} onPointerLeave={() => onPreview?.(false)} onFocus={() => onPreview?.(true)} onBlur={() => onPreview?.(false)}>
        <Swatch style={d.before.swatch} photo={photo(d.before)} /><span className="chip-label">{d.before.label}</span>
      </button>
      <ChevronSmall />
      <div className={`chip after ${issue ? 'at-risk' : ''}`}>
        <Swatch style={d.after.swatch} photo={photo(d.after)} /><span className="chip-label">{d.after.label}</span>
      </div>
    </div>
    {footer}
  </article>;
}

// Paper: "Decisions — Option B · Filter open".
function FilterMenu({ room, status, unseen, issues, onRoom, onStatus, onMarkAllSeen, onDismiss }: {
  room: RoomFilter; status: StatusFilter; unseen: number; issues: number;
  onRoom: (r: RoomFilter) => void; onStatus: (s: StatusFilter) => void; onMarkAllSeen: () => void; onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const outside = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest('.filter-button')) onDismiss();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const counts: Record<RoomFilter, number> = {
    all: 3 + EARLIER_DECISIONS.length, kitchen: 3,
    'primary-bath': EARLIER_DECISIONS.filter(e => e.room === 'primary-bath').length, garage: EARLIER_DECISIONS.filter(e => e.room === 'garage').length,
  };
  const Item = ({ label, count, on, onClick, risk }: { label: string; count: number; on: boolean; onClick: () => void; risk?: boolean }) =>
    <button role="menuitemradio" aria-checked={on} className="menu-item" onClick={onClick}>
      <MenuCheck on={on} /><span className="menu-text">{label}</span><span className={`menu-count ${risk && count ? 'risk' : ''}`}>{count}</span>
    </button>;
  return <div className="filter-menu" role="menu" aria-label="Filter decisions" ref={ref}>
    <div className="menu-label">Room</div>
    <Item label="All rooms" count={counts.all} on={room === 'all'} onClick={() => onRoom('all')} />
    {ROOMS.map(r => <Item key={r.id} label={r.label} count={counts[r.id]} on={room === r.id} onClick={() => onRoom(r.id)} />)}
    <div className="menu-divider"><span /></div>
    <div className="menu-label status">Status</div>
    <Item label="All changes" count={counts.all} on={status === 'all'} onClick={() => onStatus('all')} />
    <Item label="Unseen" count={unseen} on={status === 'unseen'} onClick={() => onStatus('unseen')} />
    <Item label="Has an issue" count={issues} on={status === 'issue'} onClick={() => onStatus('issue')} risk />
    <div className="menu-divider"><span /></div>
    <button role="menuitem" className="menu-item" onClick={onMarkAllSeen}>
      <DoubleCheck /><span className="menu-text">Mark all as seen</span><span className="menu-shortcut">⇧ M</span>
    </button>
  </div>;
}
