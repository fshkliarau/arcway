import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { PersonalItem } from './personalItems';

// Isolated approximation; replace this geometry with a GLB while keeping metre units.
export const TABLE_POSITION: [number, number, number] = [.7, 0, 3.6];
function Leg({ top, bottom, material }: { top: THREE.Vector3; bottom: THREE.Vector3; material: THREE.Material }) {
  const midpoint = top.clone().add(bottom).multiplyScalar(.5);
  const direction = top.clone().sub(bottom);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={midpoint} quaternion={rotation} material={material} castShadow receiveShadow>
    <cylinderGeometry args={[.042, .028, direction.length(), 4]} />
  </mesh>;
}
export default function PersonalTable({ item, reduced, settled }: { item: PersonalItem; reduced: boolean; settled: boolean }) {
  const root = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c6a574', roughness: .66, transparent: true, opacity: 0 }), []);
  const { width, depth, height } = item.dimensions;
  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = Math.min(Math.max((elapsed.current - (reduced ? 0 : .65)) / (reduced ? .15 : .9), 0), 1);
    const eased = 1 - Math.pow(1 - t, 3);
    material.opacity = eased;
    if (root.current) { root.current.visible = t > 0; root.current.scale.setScalar(reduced ? 1 : .97 + .03 * eased); root.current.position.y = reduced ? 0 : .035 * (1 - eased); }
  });
  return <group position={TABLE_POSITION}>
    <group ref={root} visible={false}>
      <RoundedBox args={[width, .035, depth]} radius={.012} smoothness={3} position={[0, height - .0175, 0]} material={material} castShadow receiveShadow />
      <mesh position={[0, height - .085, 0]} material={material} castShadow><boxGeometry args={[width - .38, .095, .055]} /></mesh>
      {[-1, 1].flatMap(x => [-1, 1].map(z => <Leg key={`${x}:${z}`} material={material}
        top={new THREE.Vector3(x * (width / 2 - .27), height - .035, z * .19)}
        bottom={new THREE.Vector3(x * (width / 2 - .11), .025, z * (depth / 2 - .045))} />))}
    </group>
    {settled && <Html position={[width / 2 + 1.05, height + .18, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="object-label glass"><span className="item-kind">My thing</span><strong>{item.brand} {item.name}</strong><span>200 × 80 × 74 cm · {item.material}</span></div>
    </Html>}
  </group>;
}
