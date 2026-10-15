import { useEffect, useMemo, useState } from 'react';
import { productShots } from '../kitchen/productShots';
import type { PendantKind } from '../kitchen/pendants';
import { ALTERNATIVES, ORIGINAL, QUESTIONS, formatDate, recommend, type Alternative, type Answers } from '../replacements';
import { BackIcon, CheckIcon, CloseIcon, SparkleIcon } from './icons';

type Screen = 'options' | 'quiz' | 'result';
type Props = { onBack: () => void; onClose: () => void; onPreview: (kind: PendantKind) => void; onApply: (id: Alternative['id']) => void };

function Header({ title, onBack, onClose }: { title: string; onBack: () => void; onClose?: () => void }) {
  return <div className="panel-header with-back">
    <h2 className="panel-title"><button className="icon-button" aria-label="Back" onClick={onBack}><BackIcon /></button>{title}</h2>
    {onClose && <button className="icon-button" aria-label="Close" onClick={onClose}><CloseIcon /></button>}
  </div>;
}
const Arrives = ({ a }: { a: Alternative }) => <span className="arrives"><CheckIcon />Arrives {formatDate(a.arrives)}</span>;
const Radio = ({ on }: { on: boolean }) => <span className="radio" aria-hidden="true">{on && <CheckIcon />}</span>;

// Replacement for the late pendant, in the Decisions panel's place.
// The 3D kitchen previews the hovered option, else the selected or recommended one.
export default function ReplacePanel({ onBack, onClose, onPreview, onApply }: Props) {
  const shots = useMemo(productShots, []);
  const [screen, setScreen] = useState<Screen>('options');
  const [selected, setSelected] = useState<Alternative['id']>('hudson-dome');
  const [hovered, setHovered] = useState<Alternative['id'] | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const result = useMemo(() => recommend(answers), [answers]);
  const previewing = screen === 'result' ? result.pick.id : screen === 'options' ? hovered ?? selected : selected;
  useEffect(() => onPreview(previewing), [previewing]);

  if (screen === 'quiz') {
    const q = QUESTIONS[step], value = answers[q.key];
    return <section className="panel" aria-label="Help me decide">
      <Header title="Help me decide" onBack={() => step ? setStep(step - 1) : setScreen('options')} />
      <div className="panel-body">
        <p className="quiz-intro">Answer a few questions to find the best replacement.</p>
        <div className="progress" aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}>
          <span className="progress-label">{step + 1} of {QUESTIONS.length}</span>
          <span className="progress-bars">{QUESTIONS.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}</span>
        </div>
        <h3 className="question" id="question">{q.title}</h3>
        <div role="radiogroup" aria-labelledby="question" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {q.options.map(o => <button key={o.value} role="radio" aria-checked={value === o.value} className={`answer ${value === o.value ? 'selected' : ''}`}
            onClick={() => setAnswers({ ...answers, [q.key]: o.value })}>
            <Radio on={value === o.value} /><span className="answer-label">{o.label}</span>
            {'image' in o && <span className="answer-thumb"><img src={shots[o.image]} alt="" /></span>}
          </button>)}
        </div>
      </div>
      <div className="panel-footer">
        <button className="button secondary" onClick={() => step ? setStep(step - 1) : setScreen('options')}>Back</button>
        <button className="button primary" disabled={!value} onClick={() => step < QUESTIONS.length - 1 ? setStep(step + 1) : setScreen('result')}>Continue</button>
      </div>
    </section>;
  }

  if (screen === 'result') {
    const { pick, summary, reasons } = result;
    return <section className="panel" aria-label="Our recommendation">
      <Header title="Our recommendation" onBack={() => setScreen('quiz')} />
      <div className="panel-body">
        <div className="card rec-card">
        <div className="hero-shot"><img src={shots[pick.id]} alt={`${pick.name} pendant — ${pick.description.toLowerCase()}`} /></div>
        <div className="rec">
          <div className="rec-head">
            <div><div className="rec-name">{pick.name}</div><div className="option-maker">{pick.maker}</div></div>
            <div className="rec-meta"><span className="option-price num">+${pick.price}</span><Arrives a={pick} /></div>
          </div>
          <p className="rec-summary">{summary}</p>
          <ul className="reasons">{reasons.map(r => <li key={r}><CheckIcon />{r}</li>)}</ul>
        </div>
        </div>
        <button className="text-link" onClick={() => { setSelected(pick.id); setScreen('options'); }}>See other options</button>
      </div>
      <div className="panel-footer">
        <button className="button secondary" onClick={() => { setStep(QUESTIONS.length - 1); setScreen('quiz'); }}>Back to questions</button>
        <button className="button primary" onClick={() => onApply(pick.id)}>Use {pick.name}</button>
      </div>
    </section>;
  }

  return <section className="panel" aria-label="Replace pendant">
    <Header title="Replace pendant" onBack={onBack} onClose={onClose} />
    <div className="panel-body">
      <div className="card context">
        <span className="context-thumb"><img src={shots['arteriors-volt']} alt="" /></span>
        <div>
          <div className="context-title">{ORIGINAL.name} won’t arrive in time</div>
          <div className="context-sub"><strong>Expected {ORIGINAL.expected}</strong> · Needed by {ORIGINAL.needed}</div>
        </div>
      </div>
      <div className="section-head">
        <h3 className="section-title" id="alternatives">Alternatives</h3>
        <span className="section-meta">All arrive before {ORIGINAL.needed}</span>
      </div>
      <div role="radiogroup" aria-labelledby="alternatives" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ALTERNATIVES.map(a => <button key={a.id} role="radio" aria-checked={selected === a.id} className={`option ${selected === a.id ? 'selected' : ''}`} onClick={() => setSelected(a.id)}
          onPointerEnter={() => setHovered(a.id)} onPointerLeave={() => setHovered(h => h === a.id ? null : h)}>
          <span className="product-thumb"><img src={shots[a.id]} alt={`${a.name} — ${a.description.toLowerCase()}`} /></span>
          <span className="option-body">
            <span className="option-top">
              <span><span className="option-name">{a.name}</span><span className="option-maker">{a.maker}</span></span>
              <Radio on={selected === a.id} />
            </span>
            <span className="option-bottom"><span className="option-price num">+${a.price}</span><Arrives a={a} /></span>
          </span>
        </button>)}
      </div>
    </div>
    <div className="panel-footer">
      <button className="button secondary" onClick={() => { setStep(0); setScreen('quiz'); }}><SparkleIcon />Help me decide</button>
      <button className="button primary" onClick={() => onApply(selected)}>Use this option</button>
    </div>
  </section>;
}
