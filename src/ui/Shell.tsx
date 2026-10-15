import { ArcwayLogo, AskAIIcon, ChevronDown, DecisionsIcon, HouseIcon, MenuIcon, OptionsIcon, PlusIcon, StatusIcon } from './icons';

const SECTIONS = [
  { id: 'house', label: 'House', Icon: HouseIcon },
  { id: 'options', label: 'Options', Icon: OptionsIcon },
  { id: 'decisions', label: 'Decisions', Icon: DecisionsIcon },
  { id: 'status', label: 'Status', Icon: StatusIcon },
  { id: 'ask', label: 'Ask AI', Icon: AskAIIcon },
] as const;

type Props = { estimate: string; active: 'decisions' | 'things' | null; onAdd: () => void; onDecisions: () => void };

// Paper: "Minimal nav — Option 4 · In top bar". One pill: menu, wordmark, project,
// then icon-only sections (label as a tooltip on hover) and "+" for My things.
export function TopNav({ estimate, active, onAdd, onDecisions }: Props) {
  return <>
    <header className="nav-pill">
      <button className="nav-icon" aria-label="Menu"><MenuIcon /></button>
      <ArcwayLogo />
      <span className="nav-divider" />
      <button className="project-switcher" aria-label="Switch project, current: Johnson Residence"><span>Johnson Residence</span><ChevronDown /></button>
      <span className="nav-divider" />
      <nav className="nav-sections" aria-label="Project">
        {SECTIONS.map(({ id, label, Icon }) => {
          const on = id === 'decisions' && active === 'decisions';
          return <button key={id} className={`nav-section ${on ? 'active' : ''}`} aria-label={label}
            aria-pressed={id === 'decisions' ? on : undefined} onClick={id === 'decisions' ? onDecisions : undefined}>
            <Icon /><span className="tip" aria-hidden="true">{label}</span>
          </button>;
        })}
      </nav>
      <button className={`nav-add ${active === 'things' ? 'active' : ''}`} aria-label="My things" aria-pressed={active === 'things'} onClick={onAdd}>
        <PlusIcon /><span className="tip" aria-hidden="true">My things</span>
      </button>
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
