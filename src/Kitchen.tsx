import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei';
import { Bloom, EffectComposer, HueSaturation, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import Architecture, { WINDOW } from './kitchen/Architecture';
import Cabinetry from './kitchen/Cabinetry';
import Island from './kitchen/Island';
import Accessories from './kitchen/Accessories';
import { FinishesContext, useFinishes } from './kitchen/finishes';
import { materials } from './kitchen/materials';
import { quartzMap } from './kitchen/textures';
import PersonalTable from './PersonalTable';
import type { PersonalItem } from './personalItems';
import type { DecisionId, Finishes } from './decisions';

RectAreaLightUniformsLib.init();
type KitchenProps = {
  item: PersonalItem | null; settled: boolean; reduced: boolean;
  finishes: Finishes; focus: DecisionId | null;
  /** Screen pixels covered by UI on the left; the frame re-centres in the space that's left. */
  inset: number;
};

type View = { camera: THREE.Vector3; target: THREE.Vector3 };
const view = (camera: [number, number, number], target: [number, number, number]): View =>
  ({ camera: new THREE.Vector3(...camera), target: new THREE.Vector3(...target) });
// Eye-level 3/4 compositions (metres). The second opens up the dining area.
const VIEWS = { kitchen: view([2.96, 1.5, 4], [-.6, 1.5, -1.2]), dining: view([3.4, 2.1, 8.2], [-.2, 1.1, 1.6]) };
// Close-ups held while a decision card is hovered.
const FOCUS: Record<DecisionId, View> = {
  countertops: view([2.3, 1.85, .75], [-.7, .9, -.68]),
  cabinets: view([2.7, 1.5, 1.7], [1.05, 1.2, -2.7]),
  pendant: view([1.75, 1.5, 2.1], [-.55, 1.58, -.64]),
};

// Low morning sun through the glazing, cool skylight fill, warm interior bounce.
function Daylight() {
  const sun = new THREE.Vector3(-9, 4.3, 4.6);
  const cz = (WINDOW.z0 + WINDOW.z1) / 2;
  return <>
    <directionalLight position={sun} intensity={13} color="#ffe8cc" castShadow
      shadow-mapSize={[4096, 4096]} shadow-bias={-.0001} shadow-normalBias={.025}
      shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11}
      shadow-camera-near={1} shadow-camera-far={30} />
    <rectAreaLight position={[-3.96, 1.3, cz]} rotation={[0, -Math.PI / 2, 0]} width={WINDOW.z1 - WINDOW.z0} height={2.4} intensity={2.6} color="#eaf1f4" />
    <hemisphereLight args={['#fff6ea', '#cfb08c', .45]} />
    {/* Fake first bounce: the sunlit floor warms the ceiling and island faces. */}
    <rectAreaLight position={[-2.2, .02, .4]} rotation={[Math.PI / 2, 0, 0]} width={3.5} height={4} intensity={1.4} color="#ffd6a8" />
    <Environment resolution={256} environmentIntensity={.6}>
      <Lightformer form="rect" intensity={3} color="#fff7ec" position={[-6, 1.5, .4]} rotation-y={Math.PI / 2} scale={[5, 2.6, 1]} />
      <Lightformer form="rect" intensity={.7} color="#fff0dc" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      <Lightformer form="rect" intensity={.45} color="#eadccb" position={[6, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={.35} color="#eadccb" position={[0, 1.5, 8]} rotation-y={Math.PI} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={.7} color="#e2c7a4" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
  </>;
}

// Architectural shift lens: the camera stays level so verticals stay true,
// and the frame drops to favour the room over the ceiling.
const LENS_SHIFT = .06;

// Eases the camera toward a goal view. Orbit is handed back only once the camera
// is at rest outside a focus, so the user's own framing is never fought over.
function CameraRig({ hasItem, focus, inset, reduced }: { hasItem: boolean; focus: DecisionId | null; inset: number; reduced: boolean }) {
  const { camera, size } = useThree();
  const controls = useRef<any>(null);
  const goal = useRef<View | null>(null), rest = useRef<View | null>(null), shift = useRef(inset), firstItem = useRef(true);
  const [steering, setSteering] = useState(false);
  const snapshot = (): View => ({ camera: camera.position.clone(), target: controls.current.target.clone() });
  useEffect(() => {
    if (focus) {
      // If a return trip is in flight, its destination is the real resting view.
      rest.current ??= goal.current ?? snapshot();
      goal.current = FOCUS[focus];
    } else if (rest.current) { goal.current = rest.current; rest.current = null; }
    else return;
    setSteering(true);
  }, [focus]);
  useEffect(() => {
    if (firstItem.current) { firstItem.current = false; return; }
    rest.current = null; goal.current = hasItem ? VIEWS.dining : VIEWS.kitchen; setSteering(true);
  }, [hasItem]);
  useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera]);
  useFrame((_, dt) => {
    // Horizontal lens shift re-centres the room beside the panel; vertical keeps verticals true.
    shift.current = reduced ? inset : THREE.MathUtils.damp(shift.current, inset, 6, dt);
    (camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, -shift.current / 2, size.height * LENS_SHIFT, size.width, size.height);
    const g = goal.current;
    if (!g || !controls.current) return;
    const k = reduced ? 1 : 1 - Math.exp(-4.5 * dt), target = controls.current.target;
    camera.position.lerp(g.camera, k); target.lerp(g.target, k); camera.lookAt(target);
    if (!focus && camera.position.distanceTo(g.camera) < .002 && target.distanceTo(g.target) < .002) {
      goal.current = null; setSteering(false);
    }
  });
  return <OrbitControls ref={controls} target={VIEWS.kitchen.target} enabled={!steering} enablePan={false}
    minDistance={3.5} maxDistance={hasItem ? 9.5 : 7.4} minPolarAngle={1.3} maxPolarAngle={1.72}
    minAzimuthAngle={.15} maxAzimuthAngle={.64} enableDamping dampingFactor={.07} rotateSpeed={.35} zoomSpeed={.5} />;
}

// Swaps the worktop slab texture; both maps are uploaded up front so a hover never stalls.
function FinishSync() {
  const { gl } = useThree(), { countertops } = useFinishes();
  useEffect(() => { gl.initTexture(quartzMap('white')); gl.initTexture(quartzMap('calacatta')); }, [gl]);
  useEffect(() => {
    const quartz = materials().quartz, white = countertops === 'white-quartz';
    quartz.map = quartzMap(white ? 'white' : 'calacatta'); quartz.roughness = white ? .3 : .2;
  }, [countertops]);
  return null;
}

function Scene({ item, settled, reduced, finishes, focus, inset }: KitchenProps) {
  return <FinishesContext.Provider value={finishes}>
    <FinishSync />
    <SoftShadows size={3.5} samples={16} focus={.15} />
    <color attach="background" args={['#ece6dc']} />
    <Daylight />
    <Architecture /><Cabinetry /><Island /><Accessories />
    {item && <PersonalTable key={item.id} item={item} reduced={reduced} settled={settled} />}
    <CameraRig hasItem={Boolean(item)} focus={focus} inset={inset} reduced={reduced} />
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={.55} distanceFalloff={.6} intensity={2.6} quality="high" />
      <Bloom mipmapBlur luminanceThreshold={.95} luminanceSmoothing={.25} intensity={.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <HueSaturation saturation={-.1} />
      <Vignette offset={.25} darkness={.4} />
    </EffectComposer>
  </FinishesContext.Provider>;
}

export default function Kitchen(props: KitchenProps) {
  return <Canvas shadows camera={{ position: VIEWS.kitchen.camera.toArray(), fov: 45, near: .1, far: 60 }} dpr={[1, 1.5]}
    gl={{ antialias: false, powerPreference: 'high-performance' }}>
    <Scene {...props} />
  </Canvas>;
}
