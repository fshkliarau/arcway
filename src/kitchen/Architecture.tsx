import { useMemo } from 'react';
import * as THREE from 'three';
import { materials } from './materials';
import { B } from './parts';

// Room shell in metres. Back wall inner face z = -3, window wall x = -4.
export const ROOM = { x0: -4, x1: 4, back: -3, front: 9, height: 2.8 };
export const WINDOW = { z0: -1.9, z1: 2.7, top: 2.5 };

function Window() {
  const { z0, z1, top } = WINDOW, x = -4.12, w = z1 - z0, cz = (z0 + z1) / 2;
  const mullions = [1, 2].map(i => z0 + (w / 3) * i);
  return <group>
    <B s={[.08, .06, w]} p={[x, top - .03, cz]} m="windowFrame" />
    <B s={[.08, .05, w]} p={[x, .025, cz]} m="windowFrame" />
    <B s={[.08, .04, w]} p={[x, 2.06, cz]} m="windowFrame" />
    {[z0 + .03, z1 - .03, ...mullions].map(z => <B key={z} s={[.08, top, .05]} p={[x, top / 2, z]} m="windowFrame" />)}
    <mesh position={[x, top / 2, cz]} material={materials().glazing}><boxGeometry args={[.006, top, w]} /></mesh>
  </group>;
}

// A bright terrace and a soft garden backdrop so the glazing reads as daylight.
function Exterior() {
  return <group>
    <B s={[8, .04, 18]} p={[-8.2, -.07, 2]} m="terrace" />
    <mesh position={[-12.5, 4.9, 1.5]} rotation={[0, Math.PI / 2, 0]} material={materials().garden}>
      <planeGeometry args={[30, 14]} />
    </mesh>
  </group>;
}

// Sheer linen panel with irregular folds, gathered at the far end of the glazing.
function Curtain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(.62, 2.48, 90, 1), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i), v = pos.getY(i);
      pos.setZ(i, Math.sin(u * 48) * .022 + Math.sin(u * 17 + 1.3) * .012 + (v < -1.1 ? Math.sin(u * 48) * .006 : 0));
    }
    g.computeVertexNormals(); return g;
  }, []);
  return <mesh geometry={geometry} material={materials().sheer} position={[-3.97, 1.27, -1.5]} rotation={[0, Math.PI / 2, 0]} />;
}

function Downlights() {
  const spots: [number, number][] = [[-3.3, -2.55], [-.9, -2.55], [.8, -2.55], [2.8, -1.9], [-2.4, 2.4], [0, 2.4], [2.4, 2.4], [-2.4, 5.4], [0, 5.4], [2.4, 5.4]];
  return <group>{spots.map(([x, z]) => <group key={`${x}${z}`} position={[x, ROOM.height - .002, z]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={materials().blackMatte}><ringGeometry args={[.032, .042, 32]} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, .001, 0]} material={materials().ceiling}><circleGeometry args={[.032, 32]} /></mesh>
  </group>)}</group>;
}

export default function Architecture() {
  const { x0, x1, back, front, height } = ROOM, { z0, z1, top } = WINDOW;
  const depth = front - back, cz = (front + back) / 2;
  return <group>
    <B s={[x1 - x0 + .6, .04, depth + .3]} p={[0, -.02, cz]} m="floor" />
    <B s={[x1 - x0 + .4, height + .1, .2]} p={[0, height / 2, back - .1]} m="wall" />
    <B s={[.2, height + .1, depth]} p={[x1 + .1, height / 2, cz]} m="wall" />
    {/* Window wall, built around a true opening so sunlight enters through it. */}
    <B s={[.2, height + .1, z0 - back]} p={[x0 - .1, height / 2, (back + z0) / 2]} m="wall" />
    <B s={[.2, height + .1, front - z1]} p={[x0 - .1, height / 2, (z1 + front) / 2]} m="wall" />
    <B s={[.2, height - top + .1, z1 - z0]} p={[x0 - .1, (top + height + .1) / 2, (z0 + z1) / 2]} m="wall" />
    <B s={[x1 - x0 + .4, .1, depth]} p={[0, height + .05, cz]} m="ceiling" />
    {/* Invisible closure behind the camera keeps the sun out of the open side. */}
    <mesh position={[0, height / 2, front + .2]} material={materials().shadowCaster} castShadow><boxGeometry args={[x1 - x0 + .4, height + .2, .1]} /></mesh>
    <Window /><Exterior /><Curtain /><Downlights />
  </group>;
}
