import type { PendantKind } from './kitchen/pendants';

// In-stock alternatives for the late Arteriors Volt pendant (+$680, arrives Dec 18).
export const ORIGINAL = { name: 'Arteriors Volt', price: 680, expected: 'Dec 18', needed: 'Dec 10' };
const DEADLINE = new Date(2026, 11, 10);

type Look = 'brass' | 'black' | 'glass';
export type Alternative = {
  id: Extract<PendantKind, 'hudson-dome' | 'alder-cone' | 'luna-glass'>;
  name: string; maker: string; price: number; arrives: Date; look: Look; description: string;
};
export const ALTERNATIVES: Alternative[] = [
  { id: 'hudson-dome', name: 'Hudson Dome', maker: 'Rejuvenation', price: 520, arrives: new Date(2026, 10, 28), look: 'brass', description: 'Warm brass dome' },
  { id: 'alder-cone', name: 'Alder Cone', maker: 'Schoolhouse', price: 590, arrives: new Date(2026, 11, 4), look: 'black', description: 'Matte black cone' },
  { id: 'luna-glass', name: 'Luna Glass', maker: 'Visual Comfort', price: 720, arrives: new Date(2026, 11, 2), look: 'glass', description: 'Opal glass, brass details' },
];

export const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const daysEarly = (a: Alternative) => Math.round((DEADLINE.getTime() - a.arrives.getTime()) / 86_400_000);

export type Answers = { priority?: 'match' | 'budget' | 'early'; look?: Look; budget?: 'less' | 'around' | 'more' };
export const QUESTIONS = [
  { key: 'priority', title: 'What’s most important?', options: [
    { value: 'match', label: 'Closest match to the original' },
    { value: 'budget', label: 'Stay within budget' },
    { value: 'early', label: 'Arrive as early as possible' }] },
  { key: 'look', title: 'Which look do you prefer?', options: [
    { value: 'brass', label: 'Warm brass', image: 'hudson-dome' },
    { value: 'black', label: 'Minimal black', image: 'alder-cone' },
    { value: 'glass', label: 'Soft glass', image: 'luna-glass' }] },
  { key: 'budget', title: 'How flexible is the budget?', options: [
    { value: 'less', label: `Prefer to spend less than the original ($${ORIGINAL.price})` },
    { value: 'around', label: 'Around the original price is fine' },
    { value: 'more', label: 'Willing to pay more for the right option' }] },
] as const;

const withinBudget = (a: Alternative, budget: Answers['budget']) =>
  budget === 'less' ? a.price < ORIGINAL.price : budget === 'around' ? Math.abs(a.price - ORIGINAL.price) <= 100 : true;

// Transparent scoring: preferred look dominates, priority and budget break ties.
function score(a: Alternative, { priority, look, budget }: Answers) {
  let s = a.look === look ? 3 : 0;
  // The original is warm brass, so brass is the closest match and glass-with-brass the next.
  if (priority === 'match') s += { brass: 2, glass: 1, black: 0 }[a.look];
  if (priority === 'budget') s += a.price === Math.min(...ALTERNATIVES.map(x => x.price)) ? 2 : a.price < ORIGINAL.price ? 1 : 0;
  if (priority === 'early') s += daysEarly(a) === Math.max(...ALTERNATIVES.map(daysEarly)) ? 2 : daysEarly(a) >= 8 ? 1 : 0;
  if (budget === 'less') s += a.price < ORIGINAL.price ? 1.5 : -2;
  if (budget === 'around') s += Math.abs(a.price - ORIGINAL.price) <= 50 ? 1.5 : Math.abs(a.price - ORIGINAL.price) <= 100 ? 1 : 0;
  if (budget === 'more' && a.price > ORIGINAL.price) s += 1.5;
  return s;
}

export function recommend(answers: Answers) {
  const pick = [...ALTERNATIVES].sort((a, b) => score(b, answers) - score(a, answers))[0];
  const diff = pick.price - ORIGINAL.price;
  const finish = { brass: 'keeps the warm brass finish', black: 'brings the minimal black look', glass: 'adds soft opal glass with brass details' }[pick.look];
  const cost = diff < 0 ? `costs $${-diff} less than the original` : `costs $${diff} more than the original`;
  const reasons = [
    pick.look === answers.look ? 'Matches your preferred finish'
      : answers.priority === 'match' ? 'Closest to the original look'
      : answers.priority === 'budget' ? 'Lowest price of the three' : 'Earliest delivery of the three',
    withinBudget(pick, answers.budget) ? 'Meets your budget and deadline' : `Arrives ${daysEarly(pick)} days before your deadline`,
  ];
  return { pick, reasons, summary: `${pick.name} ${finish}, ${cost}, and arrives ${daysEarly(pick)} days before your deadline.` };
}
