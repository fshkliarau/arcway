import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { materials } from './materials';
import { B, Cyl, Lathe, Round, vessel, type V3 } from './parts';
import { HOB_X } from './Cabinetry';

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const TOP = .9, SHELF = 1.6;

type Leaf = { p: V3; r: V3; s: V3; c: string };
// Instanced leaves with per-leaf colour so foliage never reads as one flat mass.
function Foliage({ leaves, shape = 'leaf' }: { leaves: Leaf[]; shape?: 'leaf' | 'round' }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    leaves.forEach((l, i) => {
      o.position.set(...l.p); o.rotation.set(...l.r); o.scale.set(...l.s); o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix); ref.current!.setColorAt(i, c.set(l.c));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [leaves]);
  return <instancedMesh ref={ref} args={[undefined, undefined, leaves.length]} material={materials().leaf} castShadow receiveShadow>
    {shape === 'leaf' ? <sphereGeometry args={[1, 8, 6]} /> : <circleGeometry args={[1, 14]} />}
  </instancedMesh>;
}
const mix = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;

function Fruit({ p, kind, r = [0, 0, 0] }: { p: V3; kind: 'lemon' | 'orange'; r?: V3 }) {
  const s: V3 = kind === 'lemon' ? [.031, .031, .041] : [.041, .039, .041];
  return <group position={p} rotation={r}>
    <mesh scale={s} material={materials()[kind]} castShadow receiveShadow><sphereGeometry args={[1, 32, 24]} /></mesh>
    {kind === 'lemon' && [-1, 1].map(e => <mesh key={e} position={[0, 0, e * .04]} rotation={[Math.PI / 2, 0, 0]} scale={[.009, .012, .009]} material={materials().lemon}><sphereGeometry args={[1, 10, 8]} /></mesh>)}
  </group>;
}

function IslandStyling() {
  const bowl = vessel([[.055, 0], [.07, .006], [.12, .035], [.16, .07], [.172, .088]], .008);
  const tumbler = vessel([[.031, 0], [.034, .004], [.037, .095]], .003);
  const carafe = vessel([[.046, 0], [.05, .008], [.052, .14], [.04, .19], [.026, .22], [.025, .25], [.028, .255]], .003);
  const bottleVase = vessel([[.04, 0], [.062, .04], [.072, .1], [.06, .16], [.03, .2], [.022, .23], [.026, .245]], .005);
  const stems = useMemo(() => {
    const r = rng(9), leaves: Leaf[] = [], curves: THREE.CatmullRomCurve3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1 + r(), lean = .08 + r() * .14, h = .3 + r() * .2;
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .1, 0), new THREE.Vector3(Math.cos(a) * lean * .4, .1 + h * .55, Math.sin(a) * lean * .4), new THREE.Vector3(Math.cos(a) * lean, .1 + h, Math.sin(a) * lean)]);
      curves.push(curve);
      for (let k = 0; k < 18; k++) {
        const t = .35 + k / 18 * .65, pt = curve.getPoint(t), side = k % 2 ? 1 : -1;
        leaves.push({ p: [pt.x + Math.cos(a + side * 1.4) * .016, pt.y, pt.z + Math.sin(a + side * 1.4) * .016], r: [r() * .6, a + side * .9, r() * .5], s: [.015 + r() * .006, .015 + r() * .006, 1], c: mix('#7f8f7a', '#a9b5a3', r()) });
      }
    }
    return { leaves, curves };
  }, []);
  return <group>
    {/* Low stoneware bowl of citrus, one lemon escaped onto the stone. */}
    <group position={[.22, TOP, -.42]}>
      <Lathe pts={bowl} m="stoneware" />
      <Fruit p={[-.05, .05, .02]} kind="orange" /><Fruit p={[.055, .05, -.03]} kind="orange" r={[.4, 1, 0]} />
      <Fruit p={[.0, .05, .07]} kind="lemon" r={[.2, .6, 0]} /><Fruit p={[-.07, .053, -.06]} kind="lemon" r={[0, -.7, .2]} />
      <Fruit p={[.01, .105, .0]} kind="lemon" r={[.3, 1.9, .1]} /><Fruit p={[.09, .055, .07]} kind="orange" r={[1, 0, 0]} />
      <Fruit p={[.26, .031, .12]} kind="lemon" r={[0, .9, 0]} />
    </group>
    {/* Oak board mid-prep: a halved lemon and a knife. */}
    <group position={[-1.8, TOP, -.48]} rotation={[0, .14, 0]}>
      <Round s={[.46, .026, .3]} p={[0, .013, 0]} m="oak" radius={.008} />
      <mesh position={[.08, .057, .02]} rotation={[Math.PI, 0, 0]} scale={[.031, .031, .041]} material={materials().lemon} castShadow><sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[.08, .0575, .02]} rotation={[-Math.PI / 2, 0, 0]} scale={[.029, .039, 1]} material={materials().flesh}><circleGeometry args={[1, 24]} /></mesh>
      <B s={[.17, .002, .028]} p={[-.07, .028, -.06]} r={[0, -.3, 0]} m="steel" />
      <B s={[.1, .016, .022]} p={[-.2, .034, -.019]} r={[0, -.3, 0]} m="walnut" />
    </group>
    {/* Glassware */}
    <group position={[-.12, TOP, -.27]}><Lathe pts={carafe} m="glass" /></group>
    <group position={[.0, TOP, -.18]}><Lathe pts={tumbler} m="glass" /></group>
    <group position={[.075, TOP, -.3]}><Lathe pts={tumbler} m="glass" /></group>
    {/* Eucalyptus in a glazed bottle at the island end. */}
    <group position={[.64, TOP, -.9]}>
      <Lathe pts={bottleVase} m="glaze" />
      {stems.curves.map((c, i) => <mesh key={i} material={materials().stem} castShadow><tubeGeometry args={[c, 16, .0018, 5]} /></mesh>)}
      <Foliage leaves={stems.leaves} shape="round" />
    </group>
  </group>;
}

function CounterStyling() {
  const pot = vessel([[.05, 0], [.065, .1], [.072, .11], [.072, .125]], .007);
  const crock = vessel([[.055, 0], [.058, .005], [.058, .17]], .006);
  const bottle: [number, number][] = [[0, 0], [.031, 0], [.033, .006], [.033, .18], [.024, .205], [.012, .225], [.011, .26], [0, .26]];
  const bowlSmall = vessel([[.03, 0], [.06, .03], [.075, .05]], .005);
  const basil = useMemo(() => {
    const r = rng(4), leaves: Leaf[] = [];
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = r() * .085, y = .13 + r() * .12 * (1 - d * 5);
      leaves.push({ p: [Math.cos(a) * d, y, Math.sin(a) * d], r: [r() * 1.2 - .2, a, r() * .6], s: [.017, .026, .006], c: mix('#3f5f26', '#6f8f3e', r()) });
    }
    return leaves;
  }, []);
  return <group>
    <group position={[-3.72, TOP, -2.78]}><Lathe pts={pot} m="terracotta" /><Cyl p={[0, .11, 0]} r={.064} h={.006} m="charcoal" /><Foliage leaves={basil} /></group>
    {/* Crock of wooden spoons beside the hob. */}
    <group position={[HOB_X - .62, TOP, -2.8]}>
      <Lathe pts={crock} m="glaze" />
      {[[-.25, .1], [.18, -.2], [.05, .28]].map(([rx, rz], i) => <group key={i} rotation={[rx * .5, i * 2, rz * .5]}>
        <Cyl p={[0, .2, 0]} r={.006} h={.3} m="oak" segments={10} />
        <mesh position={[0, .36, 0]} scale={[.024, .04, .008]} material={materials().oak} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
      </group>)}
    </group>
    {/* Olive oil and a walnut salt cellar. */}
    <group position={[HOB_X + .62, TOP, -2.86]}><Lathe pts={bottle} m="bottle" /><Cyl p={[0, .27, 0]} r={.012} h={.022} m="oak" /></group>
    <group position={[HOB_X + .76, TOP, -2.72]}><Lathe pts={bowlSmall} m="walnut" /></group>
    {/* Boards leaning on the zellige. */}
    <group position={[-.62, TOP, -2.955]} rotation={[-.11, 0, 0]}>
      <Cyl p={[0, .2, 0]} r={.19} h={.022} m="walnut" rot={[Math.PI / 2, 0, 0]} />
      <Round s={[.05, .08, .022]} p={[0, .41, 0]} m="walnut" radius={.01} />
    </group>
    <group position={[-.36, TOP, -2.91]} rotation={[-.13, 0, .02]}><Round s={[.36, .48, .024]} p={[0, .24, 0]} m="oak" radius={.01} /></group>
    {/* Glazed canisters with oak lids. */}
    {[[.32, .17], [.47, .12]].map(([x, h]) => <group key={x} position={[x, TOP, -2.82]}>
      <Lathe pts={vessel([[.055, 0], [.056, h]], .005)} m="glaze" />
      <Cyl p={[0, h + .01, 0]} r={.058} h={.02} m="oak" />
    </group>)}
    <group position={[1.18, TOP, -2.74]}>
      {[0, 1, 2].map(i => <Lathe key={i} p={[0, i * .028, 0]} pts={vessel([[.04, 0], [.08, .035], [.1, .06]], .005)} m={i === 1 ? 'sand' : 'glaze'} />)}
    </group>
  </group>;
}

function ShelfStyling() {
  const tallBottle = vessel([[.04, 0], [.05, .1], [.045, .2], [.02, .26], [.018, .3], [.022, .31]], .005);
  const round = vessel([[.04, 0], [.075, .06], [.07, .12], [.035, .15], [.037, .16]], .005);
  const small = vessel([[.03, 0], [.05, .05], [.04, .09], [.03, .1]], .004);
  const books: [number, number, number, number][] = [[-1.32, .032, .25, 0], [-1.285, .038, .23, 1], [-1.245, .03, .26, 2], [-1.19, .036, .22, 3]];
  return <group>
    {/* Left shelf: plates and two stoneware vessels. */}
    {Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[-3.66, SHELF + .006 + i * .013, -2.86]} r={[.13, .12]} h={.012} m="glaze" segments={56} />)}
    <Lathe p={[-3.26, SHELF, -2.88]} pts={tallBottle} m="stoneware" />
    <Lathe p={[-3.08, SHELF, -2.83]} pts={round} m="sand" scale={.85} />
    {/* Right shelf: cookbooks, a leaning print, vessels, pantry jars. */}
    {books.map(([x, t, h, c], i) => <mesh key={x} position={[x + (i === 3 ? .02 : 0), SHELF + h / 2, -2.88]} rotation={[0, 0, i === 3 ? -.22 : 0]} material={materials().book[c]} castShadow receiveShadow>
      <boxGeometry args={[t, h, .17]} />
    </mesh>)}
    <group position={[-.5, SHELF, -2.955]} rotation={[-.07, 0, 0]}>
      <B s={[.4, .5, .018]} p={[0, .25, 0]} m="oakH" />
      <B s={[.34, .44, .004]} p={[0, .25, .01]} m="art" />
      <mesh position={[-.03, .3, .0125]} material={materials().terracotta}><circleGeometry args={[.085, 48, 0, Math.PI]} /></mesh>
      <mesh position={[.05, .17, .0125]} material={materials().charcoal}><circleGeometry args={[.035, 40]} /></mesh>
      <mesh position={[-.02, .3, .0126]} material={materials().stoneware}><planeGeometry args={[.2, .003]} /></mesh>
    </group>
    <Lathe p={[.12, SHELF, -2.87]} pts={tallBottle} m="charcoal" />
    <Lathe p={[.28, SHELF, -2.84]} pts={round} m="glaze" />
    <Lathe p={[.4, SHELF, -2.81]} pts={small} m="sand" />
    {[1.02, 1.15, 1.28].map((x, i) => <group key={x} position={[x, SHELF, -2.87]}>
      <Lathe pts={vessel([[.048, 0], [.05, .005], [.05, .19 - i * .02]], .003)} m="glass" />
      <Cyl p={[0, (.15 - i * .03) / 2, 0]} r={.044} h={.15 - i * .03} m={i === 1 ? 'terracotta' : 'sand'} />
      <Cyl p={[0, .2 - i * .02, 0]} r={.052} h={.02} m="oak" />
    </group>)}
  </group>;
}

// Potted olive tree by the glazing: curved trunk, branches, ~1,500 leaves.
function OliveTree() {
  const tree = useMemo(() => {
    const r = rng(12), leaves: Leaf[] = [], limbs: { curve: THREE.CatmullRomCurve3; radius: number }[] = [];
    const trunk = new THREE.CatmullRomCurve3([[0, .5, 0], [.04, .9, .02], [-.03, 1.25, .04], [.02, 1.5, 0]].map(p => new THREE.Vector3(...p)));
    limbs.push({ curve: trunk, radius: .03 });
    for (let i = 0; i < 9; i++) {
      const start = trunk.getPoint(.55 + r() * .45), a = i * 2.3 + r(), len = .25 + r() * .28, up = .35 + r() * .45;
      const end = start.clone().add(new THREE.Vector3(Math.cos(a) * len, up, Math.sin(a) * len));
      const mid = start.clone().lerp(end, .5).add(new THREE.Vector3(0, .08, 0));
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      limbs.push({ curve, radius: .011 });
      for (let k = 0; k < 170; k++) {
        const t = .3 + r() * .7, pt = curve.getPoint(t), spread = .1 + t * .14;
        leaves.push({
          p: [pt.x + (r() - .5) * spread * 2, pt.y + (r() - .3) * spread * 1.4, pt.z + (r() - .5) * spread * 2],
          r: [r() * Math.PI, r() * Math.PI, r() * Math.PI], s: [.0085, .036 + r() * .012, .0025],
          c: r() < .35 ? mix('#94a08a', '#b7bea8', r()) : mix('#55623f', '#76825b', r()),
        });
      }
    }
    return { leaves, limbs };
  }, []);
  return <group position={[-3.3, 0, 1.05]}>
    <Lathe pts={vessel([[.22, 0], [.27, .05], [.3, .5], [.31, .54]], .02)} m="planter" />
    <Cyl p={[0, .5, 0]} r={.29} h={.01} m="charcoal" />
    {tree.limbs.map((l, i) => <mesh key={i} material={materials().bark} castShadow><tubeGeometry args={[l.curve, 24, l.radius, 8]} /></mesh>)}
    <Foliage leaves={tree.leaves} />
  </group>;
}

export default function Accessories() {
  return <group>
    <IslandStyling /><CounterStyling /><ShelfStyling /><OliveTree />
    {/* Flat-weave linen runner in the working aisle. */}
    <B s={[2.8, .006, .72]} p={[-1.15, .003, -1.82]} m="runner" shadow={false} />
  </group>;
}
