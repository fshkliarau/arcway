import { RoundedBox } from '@react-three/drei';
import { materials } from './materials';
import { B, Cyl, Front, Pull, Round } from './parts';

// Perimeter run along the back wall (x -4 → 1.6) and a full-height bank (1.6 → 4).
export const RUN = { x0: -4, x1: 1.6, counter: .9, front: -2.4 };
export const HOB_X = -2.15;
const TALL = { x0: 1.6, x1: 4, front: -2.38, top: 2.78 };
const base: [number, number] = [.1, .87];

function BaseRun() {
  const z = RUN.front, w = RUN.x1 - RUN.x0, cx = (RUN.x0 + RUN.x1) / 2;
  return <group>
    <B s={[w, .1, .5]} p={[cx, .05, -2.75]} m="paintShadow" />
    <B s={[w, .77, .58]} p={[cx, .485, -2.71]} m="paint" />
    <Front x={[-4, -3.4]} y={base} z={z} pull="vr" />
    <Front x={[-3.4, -2.6]} y={[.1, .42]} z={z} pull="h" />
    <Front x={[-3.4, -2.6]} y={[.42, .69]} z={z} pull="h" />
    <Front x={[-3.4, -2.6]} y={[.69, .87]} z={z} pull="h" />
    {[[-2.6, -1.7], [-1.7, -.8]].map(x => <group key={x[0]}>
      <Front x={x as [number, number]} y={[.1, .55]} z={z} pull="h" />
      <Front x={x as [number, number]} y={[.55, .87]} z={z} pull="h" />
    </group>)}
    <Front x={[-.8, -.2]} y={base} z={z} pull="vr" />
    <Front x={[-.2, .4]} y={base} z={z} pull="vl" />
    <Front x={[.4, 1]} y={base} z={z} pull="vr" />
    <Front x={[1, 1.6]} y={base} z={z} pull="vl" />
    {/* 30 mm honed quartz, then a full-height zellige splash from worktop to ceiling. */}
    <B s={[w, .03, .64]} p={[cx, .885, -2.68]} m="quartz" />
    <B s={[w, 1.9, .012]} p={[cx, 1.85, -2.994]} m="tile" />
  </group>;
}

function Hob() {
  const zones: [number, number, number][] = [[-.2, -.1, .1], [.2, -.1, .085], [-.2, .12, .085], [.18, .1, .11]];
  return <group position={[HOB_X, .9, -2.66]}>
    <B s={[.78, .006, .51]} p={[0, .003, 0]} m="blackGlass" />
    {zones.map(([x, z, r]) => <mesh key={`${x}${z}`} position={[x, .0065, z]} rotation={[-Math.PI / 2, 0, 0]} material={materials().charcoal}>
      <ringGeometry args={[r - .004, r, 64]} />
    </mesh>)}
    <mesh position={[0, .0065, .215]} rotation={[-Math.PI / 2, 0, 0]} material={materials().charcoal}><planeGeometry args={[.3, .012]} /></mesh>
  </group>;
}

function HoodAndShelves() {
  const m = materials();
  const shelves: [number, number][] = [[-4, -2.85], [-1.45, 1.6]];
  return <group>
    {/* Flush plaster canopy concealing the extractor. */}
    <RoundedBox args={[1, .75, .5]} radius={.01} smoothness={3} position={[HOB_X, 2.425, -2.75]} material={m.wall} castShadow receiveShadow />
    <B s={[.94, .004, .44]} p={[HOB_X, 2.049, -2.75]} m="paintShadow" shadow={false} />
    <mesh position={[HOB_X, 2.046, -2.53]} material={m.led}><boxGeometry args={[.86, .004, .014]} /></mesh>
    <rectAreaLight position={[HOB_X, 2.04, -2.72]} rotation={[-Math.PI / 2, 0, 0]} width={.8} height={.3} intensity={6} color="#ffdcb0" />
    {shelves.map(([a, b]) => {
      const w = b - a, cx = (a + b) / 2;
      return <group key={a}>
        <B s={[w, .04, .25]} p={[cx, 1.58, -2.865]} m="oakH" />
        <mesh position={[cx, 1.558, -2.79]} material={m.led}><boxGeometry args={[w - .08, .004, .01]} /></mesh>
        <rectAreaLight position={[cx, 1.555, -2.86]} rotation={[-Math.PI / 2, 0, 0]} width={w - .1} height={.2} intensity={5} color="#ffd9aa" />
      </group>;
    })}
  </group>;
}

// Built-in oven: matte black surround, deep glass window, steel bar handle.
function Oven({ x, y }: { x: [number, number]; y: [number, number] }) {
  const w = x[1] - x[0] - .006, h = y[1] - y[0] - .006, cx = (x[0] + x[1]) / 2, cy = (y[0] + y[1]) / 2, z = TALL.front;
  const strip = .085, door = h - strip;
  return <group>
    <Round s={[w, h, .024]} p={[cx, cy, z - .009]} m="blackMatte" radius={.003} />
    <B s={[w - .004, strip - .006, .004]} p={[cx, y[1] - strip / 2 - .003, z + .004]} m="blackGlass" />
    <mesh position={[cx + .12, y[1] - strip / 2 - .003, z + .0065]} material={materials().display}><planeGeometry args={[.055, .011]} /></mesh>
    <mesh position={[cx - .14, y[1] - strip / 2 - .003, z + .0065]} material={materials().display}><planeGeometry args={[.012, .012]} /></mesh>
    <B s={[w * .78, door * .55, .004]} p={[cx, y[0] + door * .45, z + .004]} m="blackGlass" />
    <Pull p={[cx, y[1] - strip - .04, z + .003]} len={w * .82} m="steel" />
  </group>;
}

// Linen tea towel hung over the oven handle — the one deliberately casual note.
function TeaTowel({ x, y }: { x: number; y: number }) {
  const z = TALL.front + .03;
  return <group position={[x, y, z]} rotation={[0, 0, .025]}>
    <Cyl p={[0, 0, 0]} r={.011} h={.3} m="towel" rot={[0, 0, Math.PI / 2]} />
    <B s={[.3, .4, .004]} p={[0, -.2, .011]} m="towel" r={[.03, 0, 0]} />
  </group>;
}

function TallBank() {
  const z = TALL.front, top = TALL.top, cx = (TALL.x0 + TALL.x1) / 2, w = TALL.x1 - TALL.x0;
  return <group>
    <B s={[w, .1, .55]} p={[cx, .05, -2.725]} m="paintShadow" />
    <B s={[w, top - .1, .6]} p={[cx, (top + .1) / 2, -2.7]} m="paint" />
    <Front x={[1.6, 2.2]} y={[.1, 2.1]} z={z} pull="tr" />
    <Front x={[1.6, 2.2]} y={[2.1, top]} z={z} />
    <Front x={[2.2, 2.8]} y={[.1, .5]} z={z} pull="h" />
    <Front x={[2.2, 2.8]} y={[.5, .9]} z={z} pull="h" />
    <Oven x={[2.2, 2.8]} y={[.9, 1.5]} />
    <Oven x={[2.2, 2.8]} y={[1.5, 1.96]} />
    <Front x={[2.2, 2.8]} y={[1.96, top]} z={z} />
    {/* Integrated fridge-freezer behind a matched pair of panels. */}
    <Front x={[2.8, 3.4]} y={[.1, 2.1]} z={z} pull="tr" />
    <Front x={[3.4, 4]} y={[.1, 2.1]} z={z} pull="tl" />
    <Front x={[2.8, 3.4]} y={[2.1, top]} z={z} />
    <Front x={[3.4, 4]} y={[2.1, top]} z={z} />
    <TeaTowel x={2.5} y={1.375} />
  </group>;
}

export default function Cabinetry() {
  return <group><BaseRun /><Hob /><HoodAndShelves /><TallBank /></group>;
}
