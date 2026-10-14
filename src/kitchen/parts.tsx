import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials, scaledBox, worldUV, TILE, type MaterialKey } from './materials';
import { useFinishes } from './finishes';

export type V3 = [number, number, number];
const tileFor: Partial<Record<MaterialKey, number>> = {
  floor: TILE.floor, quartz: TILE.quartz, tile: TILE.tile, oak: TILE.oak, oakH: TILE.oak, walnut: TILE.oak,
  sage: 1, wall: TILE.plaster, planter: TILE.plaster, terrace: TILE.plaster, runner: TILE.linen, fabric: TILE.linen, towel: TILE.linen,
};

// Box with true-scale, world-continuous UVs.
export function B({ s, p, m, r, shadow = true }: { s: V3; p: V3; m: MaterialKey; r?: V3; shadow?: boolean }) {
  const geometry = useMemo(() => scaledBox(s, p, tileFor[m] ?? 1), [s.join(), p.join(), m]);
  return <mesh geometry={geometry} material={materials()[m]} position={p} rotation={r} castShadow={shadow} receiveShadow />;
}

export function Round({ s, p, m, radius = .003, r }: { s: V3; p: V3; m: MaterialKey; radius?: number; r?: V3 }) {
  const tile = tileFor[m] ?? 1;
  const geometry = useMemo(() => worldUV(new RoundedBoxGeometry(...s, 3, radius), p, tile), [s.join(), p.join(), radius, tile]);
  return <mesh geometry={geometry} material={materials()[m]} position={p} rotation={r} castShadow receiveShadow />;
}

// Slim brushed-bronze bar pull on two stand-offs. `p` sits on the front face.
export function Pull({ p, len, vertical = false, facing = 1, m = 'bronze' }: { p: V3; len: number; vertical?: boolean; facing?: 1 | -1; m?: MaterialKey }) {
  const mat = materials()[m], off = .026 * facing, legs = (len / 2 - .03);
  return <group position={p}>
    <mesh position={[0, 0, off]} rotation={vertical ? [0, 0, 0] : [0, 0, Math.PI / 2]} material={mat} castShadow>
      <cylinderGeometry args={[.0055, .0055, len, 16]} />
    </mesh>
    {[-legs, legs].map(o => <mesh key={o} position={vertical ? [0, o, off / 2] : [o, 0, off / 2]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
      <cylinderGeometry args={[.004, .004, Math.abs(off), 10]} />
    </mesh>)}
  </group>;
}

// Shaker frame: stiles and rails standing 8 mm proud of the recessed centre panel.
function ShakerFrame({ w, h, cx, cy, z, facing, m }: { w: number; h: number; cx: number; cy: number; z: number; facing: 1 | -1; m: MaterialKey }) {
  const s = Math.min(.068, w * .2, h * .22), d = .008, fz = z + facing * d / 2;
  return <>
    {[-1, 1].map(k => <Round key={`s${k}`} s={[s, h, d]} p={[cx + k * (w - s) / 2, cy, fz]} m={m} radius={.0025} />)}
    {[-1, 1].map(k => <Round key={`r${k}`} s={[w - s * 2, s, d]} p={[cx, cy + k * (h - s) / 2, fz]} m={m} radius={.0025} />)}
  </>;
}

type PullKind = 'h' | 'vl' | 'vr' | 'tl' | 'tr' | 'none';
// Cabinet front with a 3 mm reveal on every side. `z` is the outer face.
// Finish follows the Cabinets decision: oak slab or sage shaker.
export function Front({ x, y, z, pull = 'none', facing = 1 }: { x: [number, number]; y: [number, number]; z: number; pull?: PullKind; facing?: 1 | -1 }) {
  const shaker = useFinishes().cabinets === 'sage-shaker', m: MaterialKey = shaker ? 'sage' : 'oak';
  const w = x[1] - x[0] - .003, h = y[1] - y[0] - .003, cx = (x[0] + x[1]) / 2, cy = (y[0] + y[1]) / 2, t = .019;
  const side = facing === 1 ? 1 : -1;
  const pulls: Record<Exclude<PullKind, 'none'>, () => ReactNode> = {
    h: () => <Pull p={[cx, y[1] - .055, z]} len={Math.min(.48, w * .55)} facing={facing} />,
    vl: () => <Pull p={[x[0] + .05 * side, y[1] - .13, z]} len={.18} vertical facing={facing} />,
    vr: () => <Pull p={[x[1] - .05 * side, y[1] - .13, z]} len={.18} vertical facing={facing} />,
    tl: () => <Pull p={[x[0] + .05, 1.1, z]} len={.62} vertical facing={facing} />,
    tr: () => <Pull p={[x[1] - .05, 1.1, z]} len={.62} vertical facing={facing} />,
  };
  return <>
    <Round s={[w, h, t]} p={[cx, cy, z - facing * t / 2]} m={m} radius={.0025} />
    {/* Always mounted, toggled by visibility, so previewing the finish never stalls on geometry. */}
    <group visible={shaker}><ShakerFrame w={w} h={h} cx={cx} cy={cy} z={z} facing={facing} m="sage" /></group>
    {pull !== 'none' && pulls[pull]()}
  </>;
}

// Turned objects from a [radius, height] profile.
export function Lathe({ pts, m, p = [0, 0, 0], scale = 1, segments = 48 }: { pts: [number, number][]; m: MaterialKey; p?: V3; scale?: number | V3; segments?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);
    g.computeVertexNormals(); return g;
  }, [JSON.stringify(pts), segments]);
  return <mesh geometry={geometry} material={materials()[m]} position={p} scale={scale} castShadow receiveShadow />;
}

// Closed vessel profile: outer wall, rim, then inner wall back down.
export function vessel(outer: [number, number][], wall = .006): [number, number][] {
  const inner = [...outer].reverse().filter(([, y]) => y > wall).map(([x, y]) => [Math.max(x - wall, 0), y] as [number, number]);
  return [[0, 0], ...outer, ...inner, [0, wall]];
}

export function Cyl({ p, r, h, m, rot, segments = 40 }: { p: V3; r: number | [number, number]; h: number; m: MaterialKey; rot?: V3; segments?: number }) {
  const [top, bottom] = typeof r === 'number' ? [r, r] : r;
  return <mesh position={p} rotation={rot} material={materials()[m]} castShadow receiveShadow>
    <cylinderGeometry args={[top, bottom, h, segments]} />
  </mesh>;
}
