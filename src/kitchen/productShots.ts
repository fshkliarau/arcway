import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { materials } from './materials';
import { buildPendant, type PendantKind } from './pendants';

// Studio product shots of the pendant models, rendered once offscreen to PNG.
// The same PBR materials as the kitchen, lit by a neutral softbox environment.
let cache: Record<PendantKind, string> | null = null;
// Shade [diameter, height] in metres; each shot is framed to its own product.
const SHADE: Record<PendantKind, [number, number]> = {
  'arteriors-volt': [.344, .27], hudson: [.28, .24], 'hudson-dome': [.42, .175], 'alder-cone': [.352, .24], 'luna-glass': [.3, .335],
};

export function productShots(): Record<PendantKind, string> {
  if (cache) return cache;
  const size = 560, renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight('#fff3e2', 1.6); key.position.set(-1.5, 2, 2.5); scene.add(key);
  const camera = new THREE.PerspectiveCamera(26, 1, .05, 20);
  const shots = {} as Record<PendantKind, string>;
  // Catalogue lighting: lamps dimmed so opal and brass keep their form instead of blooming.
  const { opal, brass } = materials(), saved = [opal.emissiveIntensity, brass.anisotropy, brass.roughness] as const;
  opal.emissiveIntensity = .22; brass.anisotropy = .15; brass.roughness = .3;
  for (const kind of Object.keys(SHADE) as PendantKind[]) {
    const [w, h] = SHADE[kind], size = Math.max(w, h), pendant = buildPendant(kind, 0, 1.2);
    scene.add(pendant);
    // Just below the rim so the diffuser reads; distance fits the product to ~70% of frame.
    const d = size * 3.3;
    camera.position.set(0, h * .5 - size * .32, d); camera.lookAt(0, h * .5, 0);
    renderer.render(scene, camera);
    shots[kind] = renderer.domElement.toDataURL('image/png');
    scene.remove(pendant);
    pendant.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  }
  [opal.emissiveIntensity, brass.anisotropy, brass.roughness] = saved;
  pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss();
  return (cache = shots);
}
