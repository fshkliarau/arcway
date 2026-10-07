import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import PersonalTable from './PersonalTable';
import type { PersonalItem } from './personalItems';
type KitchenProps = { item: PersonalItem | null; settled: boolean; reduced: boolean };

// Tunable scene palette and camera compositions, in metres.
const sage = '#727b60', wood = '#876448', stone = '#e5dfd0';
function useSurface(kind: 'wood' | 'stone') {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    let seed = 83; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.fillStyle = kind === 'wood' ? '#987654' : '#e9e5da'; ctx.fillRect(0,0,512,512);
    if(kind === 'wood') for(let i=0;i<950;i++) {const x=rand()*512; ctx.strokeStyle=`rgba(65,39,23,${rand()*.15})`;ctx.lineWidth=rand()*2;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+rand()*18,170,x-rand()*18,350,x,512);ctx.stroke();}
    else for(let i=0;i<30;i++){let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<8;j++){x+=rand()*90-28;y+=rand()*60;ctx.lineTo(x,y);}ctx.strokeStyle=`rgba(135,118,84,${rand()*.25})`;ctx.lineWidth=rand()*2+.4;ctx.stroke();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace; return t;
  },[kind]);
}
function Box({ p, s, color = stone, map, ...rest }: {p: [number,number,number];s:[number,number,number];color?:string;map?:THREE.Texture} & Record<string,any>) {return <mesh position={p} castShadow receiveShadow {...rest}><boxGeometry args={s}/><meshStandardMaterial color={color} map={map} roughness={.76}/></mesh>}
function Vase({p,scale=1,color='#c3b29a'}:{p:[number,number,number];scale?:number;color?:string}) {return <group position={p} scale={scale}><mesh castShadow><latheGeometry args={[ [new THREE.Vector2(.12,0),new THREE.Vector2(.2,.08),new THREE.Vector2(.22,.25),new THREE.Vector2(.13,.42),new THREE.Vector2(.12,.5)],32]}/><meshStandardMaterial color={color} roughness={.9}/></mesh></group>}
function Plant(){return <group position={[-3.9,.05,1.4]}><Vase p={[0,0,0]} scale={2.1} color="#ad9b82"/>{Array.from({length:16},(_,i)=>{const a=i*2.4;return <group key={i} position={[Math.sin(a)*.27,.8+i*.07,Math.cos(a)*.24]} rotation={[.2, a, .15]}><mesh castShadow><cylinderGeometry args={[.009,.014,1.2,5]}/><meshStandardMaterial color="#686541"/></mesh><mesh position={[.13,.43,0]} rotation={[.5,.2,-.7]} scale={[.18,.36,.08]} castShadow><sphereGeometry args={[1,10,10]}/><meshStandardMaterial color={i%2?'#697454':'#87916b'}/></mesh></group>})}</group>}
function Stool({x}:{x:number}) {return <group position={[x,0,1.55]}>{[-.21,.21].flatMap(a=>[-.2,.2].map(b=><mesh key={`${a}${b}`} position={[a,.43,b]} rotation={[b*.25,0,-a*.25]} castShadow><cylinderGeometry args={[.026,.036,.83,12]}/><meshStandardMaterial color="#403c30"/></mesh>))}<mesh position={[0,.86,0]} castShadow><cylinderGeometry args={[.32,.3,.11,40]}/><meshStandardMaterial color="#99744e" roughness={.8}/></mesh><mesh position={[0,1.1,.24]} rotation={[.15,0,0]} castShadow><boxGeometry args={[.54,.35,.065]}/><meshStandardMaterial color="#99744e"/></mesh></group>}
function Room({item, settled, reduced}: KitchenProps) {
 const timber=useSurface('wood'), marble=useSurface('stone');
 const {camera}=useThree();const controls=useRef<any>(null);
 const moving=useRef(false), elapsed=useRef(0);
 const start=useRef(new THREE.Vector3()), fromTarget=useRef(new THREE.Vector3());
 const hasItem = Boolean(item);
 useEffect(()=>{
   start.current.copy(camera.position);
   fromTarget.current.copy(controls.current?.target || new THREE.Vector3(0,1.3,-.6));
   elapsed.current=0; moving.current=true;
 },[hasItem,camera]);
 useFrame((_,dt)=>{
   if(!moving.current || !controls.current) return;
   elapsed.current+=dt;
   // A 2-second architectural move opens the foreground dining area.
   const t=Math.min(elapsed.current/(reduced?.01:2),1), e=t*t*(3-2*t);
   camera.position.lerpVectors(start.current,new THREE.Vector3(...(hasItem?[5.2,3.4,8.5]:[6.7,4.1,9.3]) as [number,number,number]),e);
   controls.current.target.lerpVectors(fromTarget.current,new THREE.Vector3(...(hasItem?[.5,.8,2.2]:[0,1.3,-.6]) as [number,number,number]),e);
   controls.current.update(); if(t===1)moving.current=false;
 });
 return <>
 <color attach="background" args={['#d8d3c7']}/><fog attach="fog" args={['#d8d3c7',25,50]}/>
 <ambientLight intensity={.85}/><hemisphereLight args={['#fff9e9','#9c8e76',1.6]}/>
 <directionalLight position={[-5,8,3]} intensity={3.5} color="#fff2d7" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-normalBias={.025}/>
 <Box p={[0,-.13,0]} s={[80,.2,80]} color="#c4b49a"/>
 {Array.from({length:24},(_,i)=><Box key={i} p={[-6+i*.53,-.018,0]} s={[.517,.02,13]} color={i%3===0?'#c2b398':'#cebea5'} map={timber}/>)}
 <Box p={[0,2.8,-3.65]} s={[30,12,.18]} color="#d0c4af"/>
 <Box p={[-5,4,-1]} s={[.16,12,18]} color="#ded4c2"/>
 {/* Tall oak-framed window: the light source stays legible in the composition. */}
 <Box p={[-4.9,2.75,.2]} s={[.12,3.8,4.5]} color="#f0efdd"/>
 {[-1.95,-.55,.85,2.4].map(z=><Box key={z} p={[-4.77,2.75,z]} s={[.19,3.9,.065]} color={wood} map={timber}/>)}
 {[.8,2.6,4.7].map(y=><Box key={y} p={[-4.75,y,.2]} s={[.2,.08,4.6]} color={wood}/>)}
 <Box p={[-4.69,.76,.2]} s={[.6,.12,4.8]} color={wood} map={timber}/>
 {/* Rear cabinets, with inset framed doors and warm brass hardware. */}
 <Box p={[0,.65,-2.98]} s={[8.4,1.3,1.1]} color="#525a47"/>
 {Array.from({length:9},(_,i)=>{const x=-3.74+i*.93;return <group key={i}><Box p={[x,.72,-2.386]} s={[.9,1.08,.06]} color={sage}/><Box p={[x,.72,-2.35]} s={[.74,.9,.025]} color="#7e866a"/><Box p={[x,.99,-2.31]} s={[.23,.026,.035]} color="#b4a37c"/></group>})}
 <Box p={[0,1.36,-2.94]} s={[8.65,.12,1.29]} map={marble} color="#ffffff"/>
 <Box p={[0,1.97,-3.51]} s={[8.65,1.2,.08]} map={marble} color="#ffffff"/>
 <Box p={[0,2.64,-3.25]} s={[8.8,.12,.67]} map={timber} color="#bf9971"/>
 <Box p={[0,3.16,-3.48]} s={[8.8,.93,.11]} map={timber} color="#b18c65"/>
 <Box p={[0,3.65,-3.23]} s={[8.8,.12,.65]} map={timber} color="#ba946a"/>
 <mesh position={[0,2.57,-3.15]}><boxGeometry args={[8.4,.015,.06]}/><meshStandardMaterial color="#fff5cf" emissive="#ffe0a2" emissiveIntensity={2}/></mesh>
 <pointLight position={[0,2.4,-2.8]} color="#ffdda5" intensity={8} distance={5}/>
 <Box p={[2.55,.77,-2.31]} s={[.84,.75,.06]} color="#292b27"/><Box p={[2.55,.81,-2.265]} s={[.68,.48,.025]} color="#41443e"/><Box p={[2.55,1.08,-2.23]} s={[.62,.03,.06]} color="#b3ada0"/>
 <Box p={[2.55,1.425,-2.9]} s={[.93,.025,.73]} color="#33362e"/>
 {[2.3,2.77].flatMap(x=>[-2.7,-3.1].map(z=><mesh key={`${x}${z}`} position={[x,1.445,z]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.14,.014,8,32]}/><meshStandardMaterial color="#77796b"/></mesh>))}
 <Box p={[-1.7,1.429,-2.9]} s={[1,.01,.67]} color="#9d9e91"/><Box p={[-1.7,1.435,-2.9]} s={[.84,.012,.53]} color="#666f64"/>
 <mesh position={[-1.7,1.68,-3.16]} rotation={[0,Math.PI,0]}><torusGeometry args={[.2,.025,12,32,Math.PI]}/><meshStandardMaterial color="#a29268" metalness={.75} roughness={.3}/></mesh><mesh position={[-1.9,1.53,-3.16]}><cylinderGeometry args={[.025,.025,.3,16]}/><meshStandardMaterial color="#a29268" metalness={.7}/></mesh>
 <Vase p={[-3.6,2.71,-3.2]} color="#b6b29f"/><Vase p={[-3.1,2.71,-3.2]} scale={.7} color="#79775f"/><Vase p={[3.6,2.71,-3.2]} color="#bfb19a"/>
 {[0,1,2].map(i=><Box key={i} p={[1.3,2.74+i*.055,-3.2]} s={[.8,.05,.3]} color={i%2?'#c3bba3':'#e0d7c3'}/>)}
 <Box p={[-.7,3.22,-3.37]} s={[.63,.93,.05]} color="#514a39"/><Box p={[-.7,3.22,-3.335]} s={[.54,.84,.02]} color="#c2b9a1"/>
 <Vase p={[3.85,1.43,-3]} scale={.8}/><Vase p={[3.48,1.43,-3]} scale={.5} color="#e7ddc8"/>
 <group>
 <RoundedBox args={[3.55,1.27,1.37]} position={[0,.69,.1]} radius={.025} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={sage} roughness={.8}/></RoundedBox>
 {Array.from({length:37},(_,i)=><Box key={i} p={[-1.74+i*.096,.7,.801]} s={[.035,1.18,.022]} color="#505b44"/>)}
 <Box p={[0,1.38,.1]} s={[3.9,.14,1.85]} color="#ffffff" map={marble}/>
 <Box p={[-1.89,.73,.1]} s={[.12,1.25,1.85]} color="#ffffff" map={marble}/><Box p={[1.89,.73,.1]} s={[.12,1.25,1.85]} color="#ffffff" map={marble}/>
 <mesh position={[.4,1.49,.1]} castShadow><cylinderGeometry args={[.39,.31,.1,40]}/><meshStandardMaterial color="#856c4b"/></mesh><Vase p={[.45,1.54,.1]} scale={.7} color="#a89b82"/><Vase p={[.1,1.53,.2]} scale={.4} color="#e5dcca"/>
 </group>
 <Stool x={-1}/><Stool x={.1}/>
 {item && <PersonalTable key={item.id} item={item} reduced={reduced} settled={settled}/>}
 {[-1.35,1.35].map(x=><group key={x} position={[x,0,.1]}><mesh position={[0,4.4,0]}><cylinderGeometry args={[.012,.012,1.8,8]}/><meshStandardMaterial color="#423e31"/></mesh><mesh position={[0,3.51,0]} castShadow><coneGeometry args={[.48,.35,48,1,true]}/><meshStandardMaterial color="#c3ab7e" side={THREE.DoubleSide} metalness={.3} roughness={.6}/></mesh><mesh position={[0,3.37,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.43,40]}/><meshStandardMaterial color="#fff0c3" emissive="#ffdf9e" emissiveIntensity={.7}/></mesh></group>)}
 <Plant/><ContactShadows position={[0,.008,0]} opacity={.3} scale={15} blur={2.5} far={5} resolution={512}/>
 <OrbitControls ref={controls} target={[0,1.3,-.6]} enablePan={false} minDistance={6} maxDistance={16} minPolarAngle={.95} maxPolarAngle={1.35} minAzimuthAngle={.15} maxAzimuthAngle={.9} enableDamping dampingFactor={.07} rotateSpeed={.35} zoomSpeed={.5} onStart={()=>{moving.current=false}}/>
 </>
}
export default function Kitchen(props: KitchenProps){return <Canvas shadows camera={{position:[6.7,4.1,9.3],fov:43}} dpr={[1,1.75]} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.12}}><Room {...props}/></Canvas>}
