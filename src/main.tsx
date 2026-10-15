import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import Kitchen from './Kitchen';
import { BASE_ESTIMATE, DECISIONS, finishesOf, money, type Decision, type DecisionId, type Finishes } from './decisions';
import { mockProduct, validProductUrl, type PersonalItem } from './personalItems';
import { ALTERNATIVES, formatDate, type Alternative } from './replacements';
import { productShots } from './kitchen/productShots';
import type { PendantKind } from './kitchen/pendants';
import { TopNav } from './ui/Shell';
import DecisionsPanel from './ui/DecisionsPanel';
import ReplacePanel from './ui/ReplacePanel';
import MyThingsPanel, { type Stage } from './ui/MyThingsPanel';
import './styles.css';

type PanelId = 'decisions' | 'replace' | 'things' | null;
// Screen width covered on the left: the panel (8px margin + 360px) when open.
const PANEL_EDGE = 368;

function App() {
  const [panel, setPanel] = useState<PanelId>('decisions');
  const [decisions, setDecisions] = useState<Decision[]>(DECISIONS);
  const [read, setRead] = useState<ReadonlySet<DecisionId>>(new Set());
  const [hovered, setHovered] = useState<DecisionId | null>(null);
  const [previewing, setPreviewing] = useState<DecisionId | null>(null);
  const [replacePreview, setReplacePreview] = useState<PendantKind | null>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // My things (mocked furniture recognition), unchanged behaviour.
  const [stage, setStage] = useState<Stage>('intro');
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  // Product shots render offscreen; warm them while the user is still looking around.
  // Safari has no requestIdleCallback, so fall back to a short timeout there.
  useEffect(() => {
    if ('requestIdleCallback' in window) { const id = requestIdleCallback(() => productShots()); return () => cancelIdleCallback(id); }
    const id = setTimeout(() => productShots(), 1500); return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (stage !== 'understanding') return;
    // Deliberately mocked recognition: 2.1 seconds, zero network requests.
    const timers = [window.setTimeout(() => setStep(1), 600), window.setTimeout(() => setStep(2), 1200),
      window.setTimeout(() => setStep(3), 1800), window.setTimeout(() => {
        setPersonalItems([mockProduct(sourceUrl.trim())]); setStage('placing');
      }, 2100)];
    return () => timers.forEach(clearTimeout);
  }, [stage, sourceUrl]);
  useEffect(() => {
    if (stage !== 'placing') return;
    const timer = window.setTimeout(() => setStage('placed'), 2200);
    return () => clearTimeout(timer);
  }, [stage]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPanel(p => p === 'replace' ? 'decisions' : p === 'things' ? null : p);
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  function open(next: PanelId) { setHovered(null); setPreviewing(null); setReplacePreview(null); setPanel(next); }
  function enterCard(id: DecisionId) {
    setHovered(id);
    setRead(prev => prev.has(id) ? prev : new Set(prev).add(id));
  }
  const markAllSeen = useCallback(() => setRead(new Set(DECISIONS.map(d => d.id))), []);
  function leaveCard(id: DecisionId) { setHovered(h => h === id ? null : h); setPreviewing(null); }
  function applyReplacement(id: Alternative['id']) {
    const alt = ALTERNATIVES.find(a => a.id === id)!;
    setDecisions(ds => ds.map(d => d.id !== 'pendant' ? d : {
      ...d, author: 'You', time: 'Just now', delta: alt.price, issue: undefined,
      after: { label: alt.name, value: alt.id, swatch: {}, photo: productShots()[alt.id] },
      resolved: `${alt.maker} · arrives ${formatDate(alt.arrives)}, before the deadline`,
    }));
    open('decisions');
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validProductUrl(sourceUrl)) { setError('Enter a full link beginning with https:// or http://.'); return; }
    setError(''); setStep(0); setStage('understanding');
  }
  function removeThing() { setStage('intro'); setPersonalItems([]); setSourceUrl(''); setError(''); setStep(0); }

  const totals = { before: BASE_ESTIMATE, now: BASE_ESTIMATE + decisions.reduce((sum, d) => sum + d.delta, 0) };
  const preview = previewing ? decisions.find(d => d.id === previewing)!.before : null;
  const finishes = useMemo<Finishes>(() => ({
    ...finishesOf(decisions),
    ...(previewing && preview ? { [previewing]: preview.value } : {}),
    ...(panel === 'replace' && replacePreview ? { pendant: replacePreview } : {}),
  }), [decisions, previewing, preview, panel, replacePreview]);
  const focus: DecisionId | null = panel === 'replace' ? 'pendant' : panel === 'decisions' ? hovered : null;
  const inset = panel ? PANEL_EDGE : 0;

  return <main>
    <div className="scene">
      <Kitchen item={personalItems[0] ?? null} settled={stage === 'placed'} reduced={reduced} finishes={finishes} focus={focus} inset={inset} />
    </div>
    <TopNav estimate={money(totals.now)} active={panel === 'things' ? 'things' : panel ? 'decisions' : null}
      onAdd={() => open(panel === 'things' ? null : 'things')} onDecisions={() => open(panel === 'decisions' || panel === 'replace' ? null : 'decisions')} />
    {(panel === 'decisions' || panel === 'replace') && <DecisionsPanel decisions={decisions} read={read} previewing={previewing} hidden={panel === 'replace'} totals={totals}
      onCardEnter={enterCard} onCardLeave={leaveCard} onPreview={setPreviewing} onReplace={() => open('replace')} onClose={() => open(null)} onMarkAllSeen={markAllSeen} />}
    {panel === 'replace' && <ReplacePanel onBack={() => open('decisions')} onClose={() => open(null)} onPreview={setReplacePreview} onApply={applyReplacement} />}
    {panel === 'things' && <MyThingsPanel stage={stage} step={step} url={sourceUrl} error={error} onStart={() => setStage('link')}
      onUrl={url => { setSourceUrl(url); setError(''); }} onSubmit={submit} onRemove={removeThing} onClose={() => open(null)} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
