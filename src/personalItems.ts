// Mock data only: the URL is retained locally; no product page is fetched.
export interface PersonalItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  dimensions: { width: number; depth: number; height: number };
  material: string;
  sourceUrl: string;
  type: 'personal-item';
}
export const homeConfiguration = { name: 'The Alder', price: 624000 };
export function mockProduct(sourceUrl: string): PersonalItem {
  return { id: 'hay-cph-30', name: 'CPH 30', brand: 'HAY', category: 'Dining table',
    dimensions: { width: 2, depth: .8, height: .74 }, material: 'Oak', sourceUrl, type: 'personal-item' };
}
export function validProductUrl(value: string): boolean {
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.'); }
  catch { return false; }
}
