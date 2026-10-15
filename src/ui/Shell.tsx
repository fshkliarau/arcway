import { ArcwayLogo, AskAIIcon, ChevronDown, DecisionsIcon, HouseIcon, MenuIcon, OptionsIcon, PlusIcon, StatusIcon } from './icons';

// Paper: "Minimal nav — Option 2 · Floating dock".
// Header content sits on a progressive blur that fades out downward instead of ending in a hard band.
export function TopNav({ estimate }: { estimate: string }) {
  return <>
    <div className="header-blur" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <span key={i} />)}</div>
    <header className="nav-pill">
      <button className="nav-icon" aria-label="Menu"><MenuIcon /></button>
      <ArcwayLogo />
      <span className="nav-divider" />
      <button className="project-switcher" aria-label="Switch project, current: Johnson Residence"><span>Johnson Residence</span><ChevronDown /></button>
    </header>
    <div className="nav-actions">
      <div className="estimate">
        <span className="estimate-label">Home estimate</span>
        <span className="estimate-value num" aria-live="polite">{estimate}</span>
      </div>
      <button className="share-button">Share</button>
    </div>
  </>;
}

const SECTIONS = [
  { id: 'house', label: 'House', Icon: HouseIcon },
  { id: 'options', label: 'Options', Icon: OptionsIcon },
  { id: 'decisions', label: 'Decisions', Icon: DecisionsIcon },
  { id: 'status', label: 'Status', Icon: StatusIcon },
  { id: 'ask', label: 'Ask AI', Icon: AskAIIcon },
] as const;

// Vertical capsule: "+" for My things, then icon-only sections. Labels show as tooltips on hover/focus.
export function Dock({ active, onAdd, onDecisions }: { active: 'decisions' | 'things' | null; onAdd: () => void; onDecisions: () => void }) {
  return <nav className="dock" aria-label="Project">
    <button className={`dock-add ${active === 'things' ? 'active' : ''}`} aria-label="My things" aria-pressed={active === 'things'} onClick={onAdd}>
      <PlusIcon /><span className="tip" aria-hidden="true">My things</span>
    </button>
    <span className="dock-spacer" />
    {SECTIONS.map(({ id, label, Icon }) => {
      const on = id === 'decisions' && active === 'decisions';
      return <button key={id} className={`dock-item ${on ? 'active' : ''}`} aria-label={label}
        aria-pressed={id === 'decisions' ? on : undefined} onClick={id === 'decisions' ? onDecisions : undefined}>
        <Icon /><span className="tip" aria-hidden="true">{label}</span>
      </button>;
    })}
  </nav>;
}
