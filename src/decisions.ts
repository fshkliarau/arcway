import type { CSSProperties } from 'react';

// Finish variants the 3D kitchen can render. Each decision swaps one of them.
export type Finishes = {
  countertops: 'white-quartz' | 'calacatta-quartz';
  cabinets: 'sage-shaker' | 'natural-oak';
  pendant: 'hudson' | 'arteriors-volt' | 'hudson-dome' | 'alder-cone' | 'luna-glass';
};
export type DecisionId = keyof Finishes;

type Choice<K extends DecisionId> = { label: string; value: Finishes[K]; swatch: CSSProperties; photo?: string };
export type Decision = { [K in DecisionId]: {
  id: K; title: string; author: string; time: string; delta: number;
  before: Choice<K>; after: Choice<K>;
  issue?: { message: string; action: string };
  resolved?: string;
} }[DecisionId];

// Mock decision log for the Johnson Residence kitchen (values from the Paper design).
export const DECISIONS: Decision[] = [
  {
    id: 'countertops', title: 'Countertops', author: 'J. Johnson', time: '12:23 PM', delta: 2450,
    before: { label: 'White Quartz', value: 'white-quartz', swatch: { backgroundColor: '#E4E1DA' } },
    after: { label: 'Calacatta Quartz', value: 'calacatta-quartz', swatch: { backgroundImage: 'linear-gradient(in oklab 115deg, oklab(96.7% .0002 .007) 0%, oklab(96.7% .0002 .007) 30%, oklab(83.8% .002 .016) 34%, oklab(96.7% .0002 .007) 40%, oklab(95.6% .0008 .009) 62%, oklab(87.1% .001 .015) 66%, oklab(95.6% .0008 .009) 72%)' } },
  },
  {
    id: 'cabinets', title: 'Cabinets', author: 'M. Reyes', time: '12:19 PM', delta: 1450,
    before: { label: 'Sage Shaker', value: 'sage-shaker', swatch: { backgroundColor: '#9AA58D' } },
    after: { label: 'Natural Oak', value: 'natural-oak', swatch: { backgroundImage: 'linear-gradient(in oklab 90deg, oklab(72.8% .029 .076) 0%, oklab(68.6% .033 .077) 20%, oklab(74.3% .028 .076) 40%, oklab(67% .034 .078) 62%, oklab(72.2% .03 .078) 82%, oklab(69.4% .031 .077) 100%)' } },
  },
  {
    id: 'pendant', title: 'Pendant', author: 'J. Johnson', time: '12:11 PM', delta: 680,
    before: { label: 'Hudson', value: 'hudson', swatch: { backgroundColor: '#2E2D2A' } },
    after: { label: 'Arteriors Volt', value: 'arteriors-volt', swatch: { backgroundImage: 'linear-gradient(in oklab 135deg, oklab(81.3% .005 .081) 0%, oklab(68.8% .012 .097) 55%, oklab(60% .015 .089) 100%)' } },
    issue: { message: 'Arrives Dec 18, after the deadline', action: 'Replace' },
  },
];

// What's specified: every decision's "after" choice.
export const finishesOf = (decisions: Decision[]) => Object.fromEntries(decisions.map(d => [d.id, d.after.value])) as Finishes;
export const CURRENT_FINISHES = finishesOf(DECISIONS);

// Estimate before this round of kitchen decisions; "now" adds their deltas.
export const BASE_ESTIMATE = 638_170;
// Earlier decisions in rooms without a 3D model yet (shown via the room filter).
export type Room = 'kitchen' | 'primary-bath' | 'garage';
export const ROOMS: { id: Room; label: string }[] = [
  { id: 'kitchen', label: 'Kitchen' }, { id: 'primary-bath', label: 'Primary bath' }, { id: 'garage', label: 'Garage' },
];
export type LogEntry = {
  id: string; room: Exclude<Room, 'kitchen'>; title: string; author: string; time: string; delta: number;
  before: { label: string; swatch: CSSProperties }; after: { label: string; swatch: CSSProperties };
};
export const EARLIER_DECISIONS: LogEntry[] = [
  { id: 'bath-faucet', room: 'primary-bath', title: 'Vanity faucet', author: 'J. Johnson', time: 'Sun', delta: 120,
    before: { label: 'Polished Chrome', swatch: { backgroundImage: 'linear-gradient(135deg, #F4F5F6, #B7BABE)' } }, after: { label: 'Matte Black', swatch: { backgroundColor: '#26262A' } } },
  { id: 'bath-mirror', room: 'primary-bath', title: 'Mirror', author: 'M. Reyes', time: 'Sun', delta: -80,
    before: { label: 'Backlit Round', swatch: { backgroundColor: '#E6ECEE' } }, after: { label: 'Framed Oak', swatch: { backgroundImage: 'linear-gradient(90deg, #C49A6C, #A97D52 50%, #C29669)' } } },
  { id: 'garage-door', room: 'garage', title: 'Garage door', author: 'M. Reyes', time: 'Sat', delta: 90,
    before: { label: 'Raised Panel', swatch: { backgroundColor: '#D9D6CF' } }, after: { label: 'Flush Steel', swatch: { backgroundColor: '#5E6164' } } },
  { id: 'garage-storage', room: 'garage', title: 'Storage wall', author: 'J. Johnson', time: 'Sat', delta: 40,
    before: { label: 'Open Shelving', swatch: { backgroundColor: '#C9B79C' } }, after: { label: 'Slatwall', swatch: { backgroundColor: '#8F9396' } } },
];
export const EARLIER = { count: EARLIER_DECISIONS.length, rooms: 'Primary bath, Garage', delta: EARLIER_DECISIONS.reduce((s, d) => s + d.delta, 0) };
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const money = (n: number) => usd.format(n);
export const signed = (n: number) => `${n < 0 ? '−' : '+'}${usd.format(Math.abs(n))}`;
