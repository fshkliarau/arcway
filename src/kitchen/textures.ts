import * as THREE from 'three';

// Procedural, seeded surface maps. Every texture is tileable and authored at a
// known real-world size (see TILE) so world-space UVs keep materials at scale.
export const TILE = { floor: 4.4, quartz: 3.2, tile: .6, oak: 1, plaster: 2, linen: .5 };

type Ctx = CanvasRenderingContext2D;
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
function canvas(w: number, h = w): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function texture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Periodic value noise so fbm fields tile seamlessly.
function noise(seed: number) {
  const r = rng(seed), N = 256, g = Float32Array.from({ length: N * N }, r);
  const s = (t: number) => t * t * (3 - 2 * t), m = (a: number, p: number) => ((a % p) + p) % p;
  return (x: number, y: number, p: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = s(x - xi), v = s(y - yi);
    const i0 = m(xi, p), j0 = m(yi, p), i1 = m(xi + 1, p), j1 = m(yi + 1, p);
    const a = g[j0 * N + i0], b = g[j0 * N + i1], c = g[j1 * N + i0], d = g[j1 * N + i1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbmField(size: number, cells: number, octaves: number, seed: number) {
  const n = noise(seed), out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let f = 0, amp = .5, freq = 1;
    for (let o = 0; o < octaves; o++) { const p = cells * freq; f += amp * n(x / size * p, y / size * p, p); freq *= 2; amp *= .5; }
    out[y * size + x] = f / (1 - Math.pow(.5, octaves));
  }
  return out;
}
function paintField(ctx: Ctx, size: number, field: Float32Array, fn: (v: number, i: number) => [number, number, number]) {
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < field.length; i++) { const [r, g, b] = fn(field[i], i); img.data.set([r, g, b, 255], i * 4); }
  ctx.putImageData(img, 0, 0);
}
// Draw a shape at every wrap offset so strokes crossing an edge tile cleanly.
function wrapped(w: number, h: number, draw: (dx: number, dy: number) => void) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) draw(dx, dy);
}

const cache = new Map<string, unknown>();
function once<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

// Wide-plank European oak: staggered boards, grain, knots, micro-bevel seams.
export const floorMaps = () => once('floor', () => {
  const S = 2048, cols = 20, cw = S / cols, pxm = S / TILE.floor, r = rng(17);
  const [c, ctx] = canvas(S), [b, bump] = canvas(S), [rc, rough] = canvas(S);
  bump.fillStyle = '#808080'; bump.fillRect(0, 0, S, S);
  for (let i = 0; i < cols; i++) {
    const x0 = i * cw; let y = r() * S; const end = y + S;
    while (y < end) {
      const len = Math.min((1.1 + r() * 1.5) * pxm, end - y);
      const hue = 29 + r() * 5, sat = 32 + r() * 9, light = 55 + r() * 6;
      const rv = Math.round(118 + r() * 40);
      for (const dy of [-S, 0, S]) {
        const py = y + dy; if (py > S || py + len < 0) continue;
        for (const g of [ctx, bump, rough]) { g.save(); g.beginPath(); g.rect(x0, py, cw, len); g.clip(); }
        ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`; ctx.fillRect(x0, py, cw, len);
        rough.fillStyle = `rgb(${rv},${rv},${rv})`; rough.fillRect(x0, py, cw, len);
        const pr = rng(Math.floor(x0 * 13 + y));
        for (let k = 0; k < 70; k++) {
          const gx = x0 + pr() * cw, wob = 2 + pr() * 7, dark = pr() < .8;
          ctx.strokeStyle = dark ? `rgba(78,48,26,${.03 + pr() * .1})` : `rgba(255,236,205,${.04 + pr() * .07})`;
          ctx.lineWidth = .4 + pr() * 2.2; ctx.beginPath(); ctx.moveTo(gx, py);
          for (let s = 1; s <= 8; s++) ctx.lineTo(gx + Math.sin(s * 1.3 + k) * wob * pr(), py + len * s / 8);
          ctx.stroke();
          if (dark && k % 3 === 0) { bump.strokeStyle = 'rgba(0,0,0,.08)'; bump.lineWidth = ctx.lineWidth; bump.stroke(); }
        }
        if (pr() < .35) { // small pin knot with growth rings
          const kx = x0 + cw * (.25 + pr() * .5), ky = py + len * (.2 + pr() * .6);
          for (let ring = 6; ring > 0; ring--) {
            ctx.strokeStyle = `rgba(70,42,22,${.06 + (6 - ring) * .03})`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(kx, ky, ring * 1.6, ring * 4.5, 0, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(62,36,18,.6)'; ctx.beginPath(); ctx.ellipse(kx, ky, 2.4, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
        // Seams: dark groove plus a catch-light on the micro-bevel.
        ctx.fillStyle = 'rgba(52,32,18,.55)'; ctx.fillRect(x0, py, 1.6, len); ctx.fillRect(x0, py, cw, 1.6);
        ctx.fillStyle = 'rgba(255,240,215,.18)'; ctx.fillRect(x0 + 1.6, py, 1.2, len);
        bump.fillStyle = '#1a1a1a'; bump.fillRect(x0, py, 2.2, len); bump.fillRect(x0, py, cw, 2.2);
        rough.fillStyle = '#e0e0e0'; rough.fillRect(x0, py, 2, len);
        for (const g of [ctx, bump, rough]) g.restore();
      }
      y += len;
    }
  }
  // Broad tonal drift so the floor never reads as a repeat.
  const F = 256, field = fbmField(F, 4, 4, 5), [n, nctx] = canvas(F);
  paintField(nctx, F, field, v => { const k = Math.round(110 + v * 90); return [k, k, k]; });
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .45; ctx.drawImage(n, 0, 0, S, S);
  return { map: texture(c), bumpMap: texture(b, false), roughnessMap: texture(rc, false) };
});

// Quartz worktops. Calacatta: bold, flowing grey-taupe veins on bright white.
// White Quartz: the plainer previous choice — a soft cloud with fine speckle, no veining.
export const quartzMap = (kind: 'calacatta' | 'white' = 'calacatta') => once(`quartz-${kind}`, () => {
  const S = 2048, r = rng(kind === 'calacatta' ? 41 : 43), [c, ctx] = canvas(S);
  const F = 512, field = fbmField(F, 6, 5, 9), [n, nctx] = canvas(F);
  paintField(nctx, F, field, kind === 'calacatta' ? v => [239 + v * 9, 237 + v * 8, 232 + v * 8] : v => [238 + v * 6, 236 + v * 6, 230 + v * 6]);
  ctx.drawImage(n, 0, 0, S, S);
  if (kind === 'white') {
    for (let i = 0; i < 26000; i++) {
      const g = 150 + r() * 70;
      ctx.fillStyle = `rgba(${g},${g - 4},${g - 10},${.12 + r() * .25})`;
      ctx.fillRect(r() * S, r() * S, 1 + r() * 1.6, 1 + r() * 1.6);
    }
    return texture(c);
  }
  const vein = (major: boolean) => {
    const pts: [number, number][] = [];
    let x = r() * S, y = r() * S, a = (major ? .35 : -.4) + r() * .7;
    const steps = major ? 110 : 44, step = major ? 26 : 18;
    for (let i = 0; i < steps; i++) { pts.push([x, y]); a += (r() - .5) * .35; x += Math.cos(a) * step; y += Math.sin(a) * step; }
    const passes: [number, string][] = major
      ? [[46, 'rgba(150,138,124,.05)'], [26, 'rgba(140,128,114,.08)'], [12, 'rgba(126,114,100,.16)'], [5, 'rgba(98,88,78,.5)']]
      : [[7, 'rgba(146,140,132,.08)'], [1.6, 'rgba(112,106,98,.4)']];
    wrapped(S, S, (dx, dy) => passes.forEach(([w, col]) => {
      ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < pts.length; i++) {
        ctx.lineWidth = w * (.45 + .55 * Math.abs(Math.sin(i * .21 + w)));
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0] + dx, pts[i - 1][1] + dy); ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy); ctx.stroke();
      }
    }));
  };
  for (let i = 0; i < 6; i++) vein(true);
  for (let i = 0; i < 20; i++) vein(false);
  return texture(c);
});

// Hand-glazed vertical-stack zellige: per-tile colour, pooled edges, wavy relief.
export const tileMaps = () => once('tile', () => {
  const S = 1024, cols = 8, rows = 2, tw = S / cols, th = S / rows, grout = 3.5, r = rng(23);
  const [c, ctx] = canvas(S), [b, bump] = canvas(S), [rc, rough] = canvas(S);
  ctx.fillStyle = '#d9d2c4'; ctx.fillRect(0, 0, S, S);
  bump.fillStyle = '#202020'; bump.fillRect(0, 0, S, S);
  rough.fillStyle = '#e6e6e6'; rough.fillRect(0, 0, S, S);
  const relief = fbmField(256, 8, 3, 3), [rf, rfctx] = canvas(256);
  paintField(rfctx, 256, relief, v => { const k = 150 + v * 90; return [k, k, k]; });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * tw + grout / 2, y = j * th + grout / 2, w = tw - grout, h = th - grout;
    const l = 86 + r() * 6, hue = 36 + r() * 8, sat = 22 + r() * 18;
    ctx.fillStyle = `hsl(${hue} ${sat}% ${l}%)`; ctx.fillRect(x, y, w, h);
    const g = ctx.createRadialGradient(x + w * (.3 + r() * .4), y + h * (.3 + r() * .4), 4, x + w / 2, y + h / 2, h * .7);
    g.addColorStop(0, 'rgba(255,252,244,.35)'); g.addColorStop(1, 'rgba(160,140,110,.18)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(150,128,96,.28)'; ctx.lineWidth = 5; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(120,100,80,${r() * .25})`; ctx.fillRect(x + r() * w, y + r() * h, 1.5, 1.5); }
    bump.save(); bump.beginPath(); bump.rect(x, y, w, h); bump.clip();
    bump.drawImage(rf, (r() * .7) * 256, (r() * .7) * 256, 70, 140, x, y, w, h);
    bump.strokeStyle = 'rgba(40,40,40,.5)'; bump.lineWidth = 8; bump.strokeRect(x, y, w, h);
    bump.restore();
    const gl = Math.round(28 + r() * 40); rough.fillStyle = `rgb(${gl},${gl},${gl})`; rough.fillRect(x, y, w, h);
  }
  return { map: texture(c), bumpMap: texture(b, false), roughnessMap: texture(rc, false) };
});

// Rift-cut oak veneer, grain along V. Clone + rotate for horizontal runs.
export const oakMap = () => once('oak', () => {
  const S = 1024, r = rng(61), [c, ctx] = canvas(S);
  ctx.fillStyle = 'hsl(31 36% 58%)'; ctx.fillRect(0, 0, S, S);
  for (let k = 0; k < 420; k++) {
    const x = r() * S, wob = 3 + r() * 10, dark = r() < .78;
    ctx.strokeStyle = dark ? `rgba(92,58,30,${.04 + r() * .12})` : `rgba(255,232,196,${.05 + r() * .08})`;
    ctx.lineWidth = .5 + r() * 2.5;
    wrapped(S, S, (dx, dy) => {
      if (dy) return;
      ctx.beginPath(); ctx.moveTo(x + dx, 0);
      for (let s = 1; s <= 16; s++) ctx.lineTo(x + dx + Math.sin(s * .8 + k) * wob, S * s / 16);
      ctx.stroke();
    });
  }
  for (let k = 0; k < 260; k++) { // medullary ray flecks
    ctx.fillStyle = `rgba(255,236,206,${.06 + r() * .1})`;
    ctx.beginPath(); ctx.ellipse(r() * S, r() * S, 1.2 + r() * 3, 4 + r() * 9, (r() - .5) * .3, 0, Math.PI * 2); ctx.fill();
  }
  return texture(c);
});
export const oakHorizontal = () => once('oakH', () => {
  const t = oakMap().clone(); t.center.set(.5, .5); t.rotation = Math.PI / 2; t.needsUpdate = true; return t;
});

// Limewashed plaster: low-contrast mottle and a whisper of relief.
export const plasterMaps = () => once('plaster', () => {
  const S = 512, field = fbmField(S, 5, 5, 31), [c, ctx] = canvas(S), [b, bump] = canvas(S);
  paintField(ctx, S, field, v => [229 + v * 14, 223 + v * 13, 213 + v * 12]);
  paintField(bump, S, field, v => { const k = 100 + v * 60; return [k, k, k]; });
  return { map: texture(c), bumpMap: texture(b, false) };
});

// Soft, out-of-focus garden seen through the glazing. Bottom 15% is ground,
// then hedge, layered trees and a pale sky band at the top.
export const gardenMap = () => once('garden', () => {
  const W = 2048, H = 1024, r = rng(77), [c, ctx] = canvas(W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H * .5);
  sky.addColorStop(0, '#eef1ef'); sky.addColorStop(1, '#f6f2e8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, rx: number, ry: number, col: string) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, col); g.addColorStop(.6, col.replace(/[\d.]+\)$/, (m) => `${+m.slice(0, -1) * .7})`)); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
  };
  const layer = (n: number, y0: number, y1: number, size: number, rgb: [number, number, number], jitter: number, a: number) => {
    for (let i = 0; i < n; i++) {
      const k = (r() - .5) * jitter;
      blob(r() * W, H * (y0 + r() * (y1 - y0)), size * (.6 + r() * .8), size * (.5 + r() * .7), `rgba(${rgb[0] + k},${rgb[1] + k},${rgb[2] + k * .6},${a})`);
    }
  };
  layer(140, .18, .5, 120, [168, 180, 158], 24, .45);   // distant canopy, hazy
  layer(220, .32, .72, 95, [118, 138, 96], 36, .5);     // mid trees
  for (let i = 0; i < 26; i++) { // trunks glimpsed between canopies
    const x = r() * W; ctx.fillStyle = `rgba(92,84,70,${.18 + r() * .2})`; ctx.fillRect(x, H * (.55 + r() * .1), 5 + r() * 8, H * .3);
  }
  layer(260, .62, .84, 70, [84, 106, 66], 30, .55);     // hedge band
  layer(70, .25, .7, 50, [236, 232, 205], 30, .3);      // sun-lit leaf highlights
  const ground = ctx.createLinearGradient(0, H * .82, 0, H);
  ground.addColorStop(0, 'rgba(200,192,170,0)'); ground.addColorStop(.25, '#cfc5af'); ground.addColorStop(1, '#ddd4c2');
  ctx.fillStyle = ground; ctx.fillRect(0, H * .82, W, H * .18);
  const t = texture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
});

// Oatmeal linen weave for the runner, tea towel and upholstery.
export const linenMaps = (stripe = false) => once(`linen${stripe}`, () => {
  const S = 512, r = rng(stripe ? 5 : 93), [c, ctx] = canvas(S), [b, bump] = canvas(S);
  ctx.fillStyle = stripe ? '#e4dccd' : '#cfc3ae'; ctx.fillRect(0, 0, S, S);
  bump.fillStyle = '#808080'; bump.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 2) {
    const a = .03 + r() * .06;
    ctx.fillStyle = `rgba(90,70,50,${a})`; ctx.fillRect(0, i, S, 1); ctx.fillRect(i, 0, 1, S);
    bump.fillStyle = `rgba(0,0,0,${a * 3})`; bump.fillRect(0, i, S, 1); bump.fillRect(i, 0, 1, S);
  }
  for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,250,240,${r() * .12})`; ctx.fillRect(r() * S, r() * S, 1 + r() * 6, 1); }
  if (stripe) { ctx.fillStyle = 'rgba(96,104,84,.55)'; [70, 92, 420, 442].forEach(x => ctx.fillRect(x, 0, 10, S)); }
  return { map: texture(c), bumpMap: texture(b, false) };
});
