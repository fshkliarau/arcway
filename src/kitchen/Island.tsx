import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { materials } from './materials';
import { B, Cyl, Front, Lathe, type V3 } from './parts';
import { useFinishes } from './finishes';
import { buildPendant, PENDANT_KINDS } from './pendants';

// 3.0 m waterfall island; work side faces the back run, seating side the room.
export const ISLAND = { x0: -2.1, x1: .9, back: -1.27, front: -.02, top: .9 };
const SINK = { x0: -1.35, x1: -.65, z0: -1.12, z1: -.72, depth: .2 };
const BODY = { x0: -2.06, x1: .86, back: -1.25, front: -.4 };
export const PENDANT_X = [-1.6, -.6, .4];
export const PENDANT_Z = (ISLAND.back + ISLAND.front) / 2;

function Countertop() {
  const { x0, x1, back, front, top } = ISLAND, t = .04, y = top - t / 2, w = x1 - x0, cx = (x0 + x1) / 2;
  const s = SINK, sz = (s.z0 + s.z1) / 2, sd = s.z1 - s.z0;
  return <group>
    {/* Slab assembled around the sink opening; world UVs keep the veining continuous. */}
    <B s={[w, t, s.z0 - back]} p={[cx, y, (back + s.z0) / 2]} m="quartz" />
    <B s={[w, t, front - s.z1]} p={[cx, y, (s.z1 + front) / 2]} m="quartz" />
    <B s={[s.x0 - x0, t, sd]} p={[(x0 + s.x0) / 2, y, sz]} m="quartz" />
    <B s={[x1 - s.x1, t, sd]} p={[(s.x1 + x1) / 2, y, sz]} m="quartz" />
    {[x0 + .02, x1 - .02].map(x => <B key={x} s={[.04, top - t, front - back]} p={[x, (top - t) / 2, (back + front) / 2]} m="quartz" />)}
  </group>;
}

function Sink() {
  const s = SINK, w = s.x1 - s.x0, d = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, y0 = ISLAND.top - .04 - s.depth;
  return <group>
    <B s={[w, .008, d]} p={[cx, y0, cz]} m="steel" />
    {[s.x0, s.x1].map(x => <B key={x} s={[.008, s.depth, d]} p={[x, y0 + s.depth / 2, cz]} m="steel" />)}
    {[s.z0, s.z1].map(z => <B key={z} s={[w, s.depth, .008]} p={[cx, y0 + s.depth / 2, z]} m="steel" />)}
    <Cyl p={[cx, y0 + .005, cz + .08]} r={.035} h={.004} m="blackMatte" />
    <Cyl p={[cx, y0 + .007, cz + .08]} r={.026} h={.004} m="steel" />
  </group>;
}

// Single-lever gooseneck in brushed stainless.
function Faucet() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([[0, .01, 0], [0, .28, 0], [0, .375, -.04], [0, .385, -.12], [0, .34, -.2], [0, .3, -.215]].map(p => new THREE.Vector3(...p))), []);
  const m = materials();
  return <group position={[(SINK.x0 + SINK.x1) / 2, ISLAND.top, SINK.z1 + .1]}>
    <Cyl p={[0, .012, 0]} r={.028} h={.024} m="steel" />
    <mesh material={m.steel} castShadow><tubeGeometry args={[curve, 80, .0135, 20]} /></mesh>
    <Cyl p={[0, .288, -.215]} r={.016} h={.03} m="steel" />
    <Cyl p={[.035, .15, 0]} r={.0065} h={.07} m="steel" rot={[0, 0, -1.2]} />
    <Cyl p={[.022, .15, 0]} r={.014} h={.03} m="steel" rot={[0, 0, Math.PI / 2]} />
    {/* Soap dispenser */}
    <Cyl p={[.26, .06, .02]} r={.016} h={.012} m="steel" />
    <Cyl p={[.26, .08, .012]} r={.006} h={.04} m="steel" rot={[.5, 0, 0]} />
  </group>;
}

// Body, work-side drawers and integrated dishwasher, fluted oak seating face.
function Body() {
  const b = BODY, s = SINK, w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2, d = b.front - b.back, cz = (b.back + b.front) / 2;
  const flutes = useRef<THREE.InstancedMesh>(null), pitch = .0265, count = Math.floor(w / pitch);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) { o.position.set(b.x0 + pitch / 2 + i * pitch, .48, b.front + .004); o.updateMatrix(); flutes.current!.setMatrixAt(i, o.matrix); }
    flutes.current!.instanceMatrix.needsUpdate = true;
  }, [count]);
  return <group>
    <B s={[w, .1, d - .1]} p={[cx, .05, cz]} m="paintShadow" />
    <B s={[w, .52, d]} p={[cx, .36, cz]} m="paint" />
    {/* Upper band split around the sink basin. */}
    <B s={[s.x0 - .01 - b.x0, .24, d]} p={[(b.x0 + s.x0 - .01) / 2, .74, cz]} m="paint" />
    <B s={[b.x1 - s.x1 - .01, .24, d]} p={[(s.x1 + .01 + b.x1) / 2, .74, cz]} m="paint" />
    <Front x={[-2.06, -1.46]} y={[.1, .42]} z={b.back} facing={-1} pull="h" />
    <Front x={[-2.06, -1.46]} y={[.42, .66]} z={b.back} facing={-1} pull="h" />
    <Front x={[-2.06, -1.46]} y={[.66, .86]} z={b.back} facing={-1} pull="h" />
    <Front x={[-1.46, -1]} y={[.1, .86]} z={b.back} facing={-1} pull="vr" />
    <Front x={[-1, -.54]} y={[.1, .86]} z={b.back} facing={-1} pull="vl" />
    <Front x={[-.54, .06]} y={[.1, .86]} z={b.back} facing={-1} pull="h" />
    <Front x={[.06, .86]} y={[.1, .5]} z={b.back} facing={-1} pull="h" />
    <Front x={[.06, .86]} y={[.5, .86]} z={b.back} facing={-1} pull="h" />
    <B s={[w, .76, .006]} p={[cx, .48, b.front + .003]} m="paintShadow" />
    <instancedMesh ref={flutes} args={[undefined, undefined, count]} material={materials().oak} castShadow receiveShadow>
      <cylinderGeometry args={[.0128, .0128, .76, 16]} />
    </instancedMesh>
  </group>;
}

// Counter stool: white-oak frame, cream bouclé seat, low curved back.
function Stool({ p, yaw }: { p: V3; yaw: number }) {
  const m = materials();
  const legs = useMemo(() => [-1, 1].flatMap(sx => [-1, 1].map(sz => {
    const top = new THREE.Vector3(sx * .14, .6, sz * .14), bottom = new THREE.Vector3(sx * .19, 0, sz * .19);
    const dir = top.clone().sub(bottom);
    return { mid: top.clone().add(bottom).multiplyScalar(.5), len: dir.length(), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()), key: `${sx}${sz}` };
  })), []);
  const backrest = useMemo(() => {
    const shape = new THREE.Shape(), a0 = Math.PI * .2, a1 = Math.PI * .8;
    shape.absarc(0, 0, .215, a0, a1, false); shape.absarc(0, 0, .197, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 3, curveSegments: 32 });
    g.rotateX(Math.PI / 2); return g;
  }, []);
  return <group position={p} rotation={[0, yaw, 0]}>
    {legs.map(l => <mesh key={l.key} position={l.mid} quaternion={l.q} material={m.oak} castShadow><cylinderGeometry args={[.014, .017, l.len, 14]} /></mesh>)}
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[Math.sin(i * Math.PI / 2) * .172, .24, Math.cos(i * Math.PI / 2) * .172]} rotation={[0, i * Math.PI / 2, Math.PI / 2]} material={m.oak} castShadow>
      <cylinderGeometry args={[.009, .009, .345, 10]} />
    </mesh>)}
    <Cyl p={[0, .61, 0]} r={.18} h={.02} m="oak" />
    <Lathe p={[0, .62, 0]} m="fabric" pts={[[0, 0], [.17, 0], [.192, .01], [.2, .03], [.196, .05], [.18, .062], [.1, .068], [0, .068]]} />
    {[-.62, .62].map(a => <mesh key={a} position={[Math.sin(a) * .2, .73, Math.cos(a) * .2]} material={m.oak} castShadow><cylinderGeometry args={[.009, .009, .22, 10]} /></mesh>)}
    <mesh geometry={backrest} position={[0, .87, 0]} material={m.oak} castShadow receiveShadow />
  </group>;
}

// Pendant decision. Every model is built once and toggled by visibility,
// so previews swap instantly without rebuilding geometry.
function Pendants() {
  const kind = useFinishes().pendant, rim = 1.68;
  const models = useMemo(() => PENDANT_KINDS.map(k => ({ k, objects: PENDANT_X.map(x => {
    const o = buildPendant(k, rim, 2.8); o.position.set(x, 0, PENDANT_Z); return o;
  }) })), []);
  return <group>
    {models.map(({ k, objects }) => <group key={k} visible={k === kind}>{objects.map((o, i) => <primitive key={i} object={o} />)}</group>)}
    {PENDANT_X.map(x => <pointLight key={x} position={[x, rim - .05, PENDANT_Z]} intensity={2.2} color="#ffcf98" distance={6} decay={2} />)}
  </group>;
}

export default function Island() {
  const z = .32;
  return <group>
    <Body /><Countertop /><Sink /><Faucet /><Pendants />
    <Stool p={[-1.56, 0, z + .02]} yaw={.07} />
    <Stool p={[-.6, 0, z]} yaw={-.04} />
    <Stool p={[.38, 0, z + .05]} yaw={.16} />
  </group>;
}
