import * as THREE from 'three';
import type { Finishes } from '../decisions';
import { materials, type MaterialKey } from './materials';

// Pendant models, built imperatively so the scene and the product-shot renderer
// share one source. Origin sits at the bottom rim; shades grow upward.
export type PendantKind = Finishes['pendant'];
type Spec = { shade: () => THREE.Object3D[]; height: number; hardware: MaterialKey; rod: number };

const lathe = (pts: [number, number][], m: MaterialKey, scale = 1) => {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * scale, y * scale)), 64);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, materials()[m]); mesh.castShadow = true; return mesh;
};
const mesh = (g: THREE.BufferGeometry, m: MaterialKey, y = 0, rotX = 0) => {
  const o = new THREE.Mesh(g, materials()[m]); o.position.y = y; o.rotation.x = rotX; o.castShadow = true; return o;
};
// Glowing opal diffuser closing a shade's mouth.
const diffuser = (r: number, y: number) => mesh(new THREE.CircleGeometry(r, 48), 'opal', y, Math.PI / 2);
// Metal shell with a warm painted interior and a diffuser.
const shell = (pts: [number, number][], outer: MaterialKey, mouth: number, inset: number) =>
  [lathe(pts, outer), lathe(pts, 'shadeInner', .97), diffuser(mouth, inset)];

const BELL: [number, number][] = [[.02, .27], [.048, .266], [.062, .23], [.075, .16], [.11, .085], [.155, .028], [.172, 0]];
const DOME: [number, number][] = [[.012, .175], [.05, .17], [.11, .145], [.165, .1], [.198, .045], [.21, 0]];
const CONE: [number, number][] = [[.016, .24], [.03, .236], [.168, .018], [.176, 0]];

const SPECS: Record<PendantKind, Spec> = {
  // Arteriors Volt — tall flared bell in brushed brass.
  'arteriors-volt': { shade: () => shell(BELL, 'brass', .16, .012), height: .27, hardware: 'brass', rod: .006 },
  // Hudson (previous selection) — matte charcoal drum on black flex.
  hudson: {
    shade: () => [mesh(new THREE.CylinderGeometry(.14, .14, .24, 48, 1, true), 'blackShade', .12),
      mesh(new THREE.CylinderGeometry(.136, .136, .238, 48, 1, true), 'shadeInner', .12),
      mesh(new THREE.CylinderGeometry(.14, .14, .006, 48), 'blackShade', .238), diffuser(.13, .03)],
    height: .24, hardware: 'blackMatte', rod: .0025,
  },
  // Rejuvenation Hudson Dome — wide, shallow warm-brass dome.
  'hudson-dome': { shade: () => shell(DOME, 'brass', .19, .012), height: .175, hardware: 'brass', rod: .006 },
  // Schoolhouse Alder Cone — matte black cone, minimal.
  'alder-cone': { shade: () => shell(CONE, 'blackShade', .16, .014), height: .24, hardware: 'blackMatte', rod: .0025 },
  // Visual Comfort Luna Glass — opal globe with a brass cap and collar.
  'luna-glass': {
    shade: () => [mesh(new THREE.SphereGeometry(.15, 64, 40), 'opal', .15),
      mesh(new THREE.CylinderGeometry(.03, .036, .04, 32), 'brass', .315),
      mesh(new THREE.TorusGeometry(.036, .004, 10, 40), 'brass', .296, Math.PI / 2)],
    height: .335, hardware: 'brass', rod: .005,
  },
};

/** Shade, rod and canopy for a pendant whose rim hangs at `rim`, with `ceiling` above. */
export function buildPendant(kind: PendantKind, rim: number, ceiling: number) {
  const spec = SPECS[kind], group = new THREE.Group(), top = rim + spec.height;
  const shade = new THREE.Group(); shade.position.y = rim; shade.add(...spec.shade()); group.add(shade);
  group.add(mesh(new THREE.CylinderGeometry(spec.rod, spec.rod, ceiling - top, 12), spec.hardware, (top + ceiling) / 2));
  group.add(mesh(new THREE.CylinderGeometry(.055, .055, .018, 40), spec.hardware, ceiling - .01));
  return group;
}
export const PENDANT_KINDS = Object.keys(SPECS) as PendantKind[];
