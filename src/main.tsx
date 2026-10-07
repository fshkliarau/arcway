import React, { useEffect, useId, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Input } from '@heroui/react';
import { ArrowRight, Check, ChevronDown, Move, RotateCcw, Link } from 'lucide-react';
import Kitchen from './Kitchen';
import { homeConfiguration, mockProduct, validProductUrl, type PersonalItem } from './personalItems';
import './styles.css';

function Panel({ title, detail, open, onToggle, children, className = '' }: {
  title: string; detail?: string; open: boolean; onToggle: () => void;
  children: React.ReactNode; className?: string;
}) {
  const id = useId();
  return <section className={`panel glass ${className}`}>
    <Button variant="ghost" className="panel-toggle" aria-expanded={open}
      aria-controls={id} aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`} onPress={onToggle}>
      <span className="panel-title">{title}</span>
      {detail && <span className="panel-detail">{detail}</span>}
      <ChevronDown size={14} className={open ? 'chevron open' : 'chevron'} />
    </Button>
    <div id={id} hidden={!open} className="panel-body">{children}</div>
  </section>;
}

type Stage = 'intro' | 'link' | 'understanding' | 'placing' | 'placed';
const understanding = ['Reading product page', 'Finding dimensions', 'Preparing for your home'];
const understood = ['HAY CPH 30 identified', '200 × 80 × 74 cm', 'Ready for your home'];
function App() {
  const [stage, setStage] = useState<Stage>('intro');
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [homeOpen, setHomeOpen] = useState(true);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [thingsOpen, setThingsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (stage !== 'understanding') return;
    // Deliberately mocked recognition: 2.1 seconds, zero network requests.
    const timers = [window.setTimeout(() => setStep(1), 600), window.setTimeout(() => setStep(2), 1200),
      window.setTimeout(() => setStep(3), 1800), window.setTimeout(() => {
        setPersonalItems([mockProduct(sourceUrl.trim())]); setStage('placing'); setThingsOpen(false);
      }, 2100)];
    return () => timers.forEach(clearTimeout);
  }, [stage, sourceUrl]);
  useEffect(() => {
    if (stage !== 'placing') return;
    const timer = window.setTimeout(() => setStage('placed'), 2200);
    return () => clearTimeout(timer);
  }, [stage]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setThingsOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  function reset() {
    setStage('intro'); setPersonalItems([]); setSourceUrl(''); setError(''); setStep(0);
    setThingsOpen(false); setHomeOpen(true); setPanelOpen(true);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validProductUrl(sourceUrl)) { setError('Enter a full link beginning with https:// or http://.'); return; }
    setError(''); setStep(0); setStage('understanding');
  }
  return <main>
    <div className="scene"><Kitchen item={personalItems[0] ?? null} settled={stage === 'placed'} reduced={reduced} /></div>
    <aside className="left-stack" aria-label="Home and personal things">
      <Panel title={homeConfiguration.name} className="home-panel" open={homeOpen} onToggle={() => setHomeOpen(!homeOpen)}>
        <div className="price-row"><span>Home total</span><span className="price">$624,000</span></div>
        <Panel className="spaces-section" title="Spaces" detail="3 / 8" open={spacesOpen} onToggle={() => setSpacesOpen(!spacesOpen)}>
          {['Entryway', 'Living room', 'Dining room', 'Kitchen', 'Primary bathroom'].map((room, i) => <div className={`space-row ${i === 3 ? 'current' : ''}`} key={room}>
            <span>{room}</span>{i < 3 ? <Check size={13} /> : <small>{i === 3 ? 'Current' : 'Up next'}</small>}
          </div>)}
        </Panel>
      </Panel>
      {thingsOpen && <Panel title="My things" open={panelOpen} onToggle={() => setPanelOpen(!panelOpen)}>
        {stage === 'intro' && <>
          <p className="muted">See how the things you love fit into your future home.</p>
          <Button className="primary" onPress={() => setStage('link')}><Link size={14} />Paste a product link<ArrowRight size={14} /></Button>
          <div className="future-actions"><Button variant="ghost" isDisabled>Upload a photo</Button><Button variant="ghost" isDisabled>Enter dimensions</Button></div>
        </>}
        {stage === 'link' && <form onSubmit={submit} noValidate>
          <label className="input-label" htmlFor="product-link">Paste a furniture link</label>
          <Input id="product-link" className="product-input" autoFocus type="url" value={sourceUrl}
            placeholder="https://www.hay.com/…/cph-30-table" aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'demo-note'}
            onChange={event => { setSourceUrl(event.target.value); setError(''); }} />
          {error && <p id="url-error" className="input-error" role="alert">{error}</p>}
          <p id="demo-note" className="demo-note">Prototype preview · any product link uses the HAY CPH 30 table.</p>
          <Button type="submit" className="primary">Add to my home<ArrowRight size={14} /></Button>
        </form>}
        {stage === 'understanding' && <div className="recognition" role="status" aria-live="polite" aria-label="Understanding your product">
          {understanding.map((label, i) => <div key={label} className={`recognition-step ${step > i ? 'complete' : step === i ? 'current' : 'pending'}`}>
            <span className="step-indicator">{step > i ? <Check size={13} /> : i + 1}</span>
            <span>{step > i ? understood[i] : label}</span>
          </div>)}
        </div>}
        {(stage === 'placing' || stage === 'placed') && <div className="product-summary"><strong>HAY CPH 30</strong><span>Dining table · Oak</span><span>200 × 80 × 74 cm</span><small>Approximate model at real scale</small></div>}
        <p className="planning-note">My things are for planning only and don’t affect your home price.</p>
      </Panel>}
    </aside>
    <div className="view-label glass"><span className="view-active">3D</span><span>{personalItems.length ? 'Kitchen / dining' : 'Kitchen'}</span></div>
    <div className="navigation-hint glass"><Move size={13} /><span>Drag to orbit · Scroll to zoom</span></div>
    <nav className="toolbar glass" aria-label="Home controls">
      <Button isIconOnly variant="ghost" className="tool-button" aria-label="Reset experience" onPress={reset}><RotateCcw size={14} /></Button>
      <span className="separator" />
      <Button variant="ghost" className={`tool-button ${!thingsOpen ? 'tool-active' : ''}`} onPress={() => { setThingsOpen(false); setHomeOpen(true); }}>Home options</Button>
      <Button variant="ghost" className={`tool-button ${thingsOpen ? 'tool-active' : ''}`} aria-expanded={thingsOpen}
        onPress={() => { setThingsOpen(!thingsOpen); setPanelOpen(true); }}>My things</Button>
    </nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
