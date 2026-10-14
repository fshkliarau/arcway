import type { FormEvent } from 'react';
import { CheckIcon, CloseIcon } from './icons';

export type Stage = 'intro' | 'link' | 'understanding' | 'placing' | 'placed';
const understanding = ['Reading product page', 'Finding dimensions', 'Preparing for your home'];
const understood = ['HAY CPH 30 identified', '200 × 80 × 74 cm', 'Ready for your home'];

type Props = {
  stage: Stage; step: number; url: string; error: string;
  onStart: () => void; onUrl: (url: string) => void; onSubmit: (e: FormEvent) => void; onRemove: () => void; onClose: () => void;
};

// "+" in the rail: try your own furniture in the home (mocked recognition).
export default function MyThingsPanel({ stage, step, url, error, onStart, onUrl, onSubmit, onRemove, onClose }: Props) {
  return <section className="panel" aria-label="My things">
    <div className="panel-header">
      <h2 className="panel-title">My things</h2>
      <button className="icon-button" aria-label="Close my things" onClick={onClose}><CloseIcon /></button>
    </div>
    <div className="panel-body">
      <div className="card things">
        {stage === 'intro' && <>
          <p>See how the things you love fit into your future home.</p>
          <button className="button primary" onClick={onStart}>Paste a product link</button>
        </>}
        {stage === 'link' && <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="input-label" htmlFor="product-link">Paste a furniture link</label>
          <input id="product-link" className="product-input" autoFocus type="url" value={url} placeholder="https://www.hay.com/…/cph-30-table"
            aria-invalid={Boolean(error)} aria-describedby={error ? 'url-error' : 'demo-note'} onChange={e => onUrl(e.target.value)} />
          {error && <p id="url-error" className="input-error" role="alert">{error}</p>}
          <p id="demo-note" className="demo-note">Prototype preview · any product link uses the HAY CPH 30 table.</p>
          <button type="submit" className="button primary">Add to my home</button>
        </form>}
        {stage === 'understanding' && <div className="recognition" role="status" aria-live="polite" aria-label="Understanding your product">
          {understanding.map((label, i) => <div key={label} className={`recognition-step ${step > i ? 'complete' : step === i ? 'current' : 'pending'}`}>
            <span className="step-indicator">{step > i ? <CheckIcon /> : i + 1}</span>
            <span>{step > i ? understood[i] : label}</span>
          </div>)}
        </div>}
        {(stage === 'placing' || stage === 'placed') && <>
          <div className="product-summary"><strong>HAY CPH 30</strong><span>Dining table · Oak · 200 × 80 × 74 cm</span><small>Approximate model at real scale</small></div>
          <button className="button secondary" onClick={onRemove}>Remove from home</button>
        </>}
        <p className="planning-note">My things are for planning only and don’t affect your home estimate.</p>
      </div>
    </div>
  </section>;
}
