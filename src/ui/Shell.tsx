import { ArcwayLogo, AskAIIcon, ChevronDown, DecisionsIcon, HouseIcon, MenuIcon, OptionsIcon, PlusIcon, StatusIcon } from './icons';

// Compact pill: menu, wordmark, project switcher. Estimate and Share sit top-right.
export function TopNav({ estimate }: { estimate: string }) {
  return <>
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

const ITEMS = [
  { id: 'house', label: 'House', Icon: HouseIcon },
  { id: 'options', label: 'Options', Icon: OptionsIcon },
  { id: 'decisions', label: 'Decisions', Icon: DecisionsIcon },
  { id: 'status', label: 'Status', Icon: StatusIcon },
  { id: 'ask', label: 'Ask AI', Icon: AskAIIcon },
] as const;

export function Rail({ active, onAdd, onDecisions }: { active: 'decisions' | 'things' | null; onAdd: () => void; onDecisions: () => void }) {
  return <>
    <button className={`add-tile ${active === 'things' ? 'active' : ''}`} aria-label="Add your own things" aria-pressed={active === 'things'} onClick={onAdd}><PlusIcon /></button>
    <nav className="rail" aria-label="Project">
      {ITEMS.map(({ id, label, Icon }) => <button key={id} className={`rail-item ${id === 'decisions' && active === 'decisions' ? 'active' : ''}`}
        aria-pressed={id === 'decisions' ? active === 'decisions' : undefined} onClick={id === 'decisions' ? onDecisions : undefined}>
        <Icon /><span>{label}</span>
      </button>)}
    </nav>
  </>;
}
