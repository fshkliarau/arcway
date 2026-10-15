import * as THREE from 'three';
import { floorMaps, gardenMap, linenMaps, oakHorizontal, oakMap, plasterMaps, quartzMap, tileMaps, TILE } from './textures';

// One shared, physically based material library for the whole scene.
// Palette: warm greige cabinetry, white oak, honed quartz, cream zellige, bronze.
let library: ReturnType<typeof build> | null = null;
export const materials = () => (library ??= build());

function build() {
  const floor = floorMaps(), tile = tileMaps(), plaster = plasterMaps(), linen = linenMaps(), towel = linenMaps(true);
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
  return {
    floor: phys({ ...floor, roughness: 1, bumpScale: 1.2, clearcoat: .12, clearcoatRoughness: .5 }),
    // Front faces in the shadow pass: thin-wall back faces sit too close to the floor and speckle.
    wall: std({ ...plaster, color: '#ffffff', roughness: .96, bumpScale: .4, shadowSide: THREE.FrontSide }),
    ceiling: std({ color: '#f8f5ef', roughness: 1 }),
    paint: std({ color: '#c3b4a0', roughness: .58 }),
    sage: std({ color: '#97a389', roughness: .6 }),
    paintShadow: std({ color: '#3d3730', roughness: .9 }),
    quartz: phys({ map: quartzMap(), roughness: .2, clearcoat: .25, clearcoatRoughness: .25 }),
    tile: phys({ ...tile, roughness: 1, bumpScale: .7, clearcoat: .6, clearcoatRoughness: .12 }),
    oak: std({ map: oakMap(), color: '#efe2d0', roughness: .55 }),
    oakH: std({ map: oakHorizontal(), color: '#efe2d0', roughness: .55 }),
    walnut: std({ map: oakHorizontal(), color: '#7a5a45', roughness: .5 }),
    brass: phys({ color: '#c09a5b', metalness: 1, roughness: .26, anisotropy: .6, side: THREE.DoubleSide }),
    blackShade: std({ color: '#1f1e1c', roughness: .55, metalness: .25, side: THREE.DoubleSide }),
    shadeInner: std({ color: '#f6f0e4', emissive: '#ffd9a6', emissiveIntensity: .35, roughness: .8, side: THREE.DoubleSide }),
    bronze: phys({ color: '#a58a62', metalness: 1, roughness: .3, anisotropy: .7 }),
    steel: phys({ color: '#bdbab4', metalness: 1, roughness: .34, anisotropy: .8 }),
    blackGlass: phys({ color: '#0a0a0b', roughness: .04, clearcoat: 1, clearcoatRoughness: .02 }),
    blackMatte: std({ color: '#1d1c1a', roughness: .5, metalness: .2 }),
    windowFrame: std({ color: '#2a2724', roughness: .42, metalness: .35 }),
    glazing: phys({ color: '#e6efee', roughness: .02, transparent: true, opacity: .06, depthWrite: false }),
    glass: phys({ color: '#ffffff', roughness: .02, transmission: 1, thickness: .02, ior: 1.5 }),
    bottle: phys({ color: '#26301c', roughness: .06, clearcoat: 1, metalness: .1 }),
    glaze: phys({ color: '#efe9df', roughness: .22, clearcoat: .6, clearcoatRoughness: .2 }),
    stoneware: std({ color: '#8c8174', roughness: .86 }),
    sand: std({ color: '#d4c6b1', roughness: .9 }),
    charcoal: std({ color: '#3b3834', roughness: .8 }),
    terracotta: std({ color: '#b98468', roughness: .9 }),
    planter: std({ ...plaster, color: '#d8d0c3', roughness: .95, bumpScale: 1.5 }),
    fabric: std({ ...linen, color: '#f6efe3', roughness: 1, bumpScale: 1.5 }),
    runner: std({ ...linen, roughness: 1, bumpScale: 1 }),
    towel: std({ ...towel, roughness: 1, bumpScale: 1, side: THREE.DoubleSide }),
    sheer: std({ color: '#f8f4ec', roughness: 1, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }),
    lemon: phys({ color: '#e7c23e', roughness: .42, clearcoat: .3 }),
    flesh: phys({ color: '#f1e19a', roughness: .3, clearcoat: .8, clearcoatRoughness: .2 }),
    orange: phys({ color: '#de7a2a', roughness: .45, clearcoat: .3 }),
    leaf: std({ color: '#ffffff', roughness: .65, side: THREE.DoubleSide }),
    stem: std({ color: '#6f6248', roughness: .9 }),
    bark: std({ color: '#7d7466', roughness: .95 }),
    book: [std({ color: '#b5a48a', roughness: .85 }), std({ color: '#5f6b58', roughness: .85 }), std({ color: '#e8e1d4', roughness: .85 }), std({ color: '#9d6b4c', roughness: .85 })],
    art: std({ color: '#e7dfd1', roughness: .95 }),
    opal: phys({ color: '#fff6e8', emissive: '#ffd9a6', emissiveIntensity: 1.5, roughness: .35 }),
    led: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe6c2').multiplyScalar(3), toneMapped: false }),
    display: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd6a0').multiplyScalar(1.6), toneMapped: false }),
    garden: new THREE.MeshBasicMaterial({ map: gardenMap(), color: new THREE.Color(1.08, 1.08, 1.08) }),
    terrace: std({ ...plaster, color: '#d6ccba', roughness: .9 }),
    shadowCaster: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  };
}
export type MaterialKey = Exclude<keyof ReturnType<typeof build>, 'book'>;

// World-space UVs in metres: textures keep true scale and run continuously
// across adjacent faces (e.g. a countertop into its waterfall end).
export function scaledBox(size: [number, number, number], at: [number, number, number], tile: number) {
  return worldUV(new THREE.BoxGeometry(...size), at, tile);
}
// Box-projected metre UVs for any geometry placed at `at` (unrotated).
export function worldUV<G extends THREE.BufferGeometry>(g: G, at: [number, number, number], tile: number) {
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + at[0], y = pos.getY(i) + at[1], z = pos.getZ(i) + at[2];
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i));
    const [u, v] = ax > .5 ? [z, y] : ay > .5 ? [x, z] : [x, y];
    uv.setXY(i, u / tile, v / tile);
  }
  return g;
}
export { TILE };
