// [AURORA-BEGIN:three-holobrain]
import { useMemo, useRef, type Ref } from 'react';
import * as THREE from 'three';
import { extend, useFrame, type ReactThreeFiber } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// Simple linear congruential generator for deterministic randomness
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Fresnel shader material
const FresnelMaterial = shaderMaterial(
  { color: new THREE.Color('#00ffff'), time: 0, pulse: 1 },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 color;
    uniform float time;
    uniform float pulse;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
      float alpha = 0.5 + 0.3 * sin(time * pulse);
      gl_FragColor = vec4(color * fresnel, alpha);
    }
  `
);
extend({ FresnelMaterial });
declare global {
  namespace JSX {
    interface IntrinsicElements {
      fresnelMaterial: ReactThreeFiber.Object3DNode<
        typeof FresnelMaterial,
        typeof FresnelMaterial
      >;
    }
  }
}

export interface HoloBrainProps {
  seed?: number;
  color?: string;
  pulse?: number;
  particles?: number;
}

export function HoloBrain({
  seed = 1,
  color = '#00ffff',
  pulse = 2,
  particles = 500,
  ...props
}: HoloBrainProps & JSX.IntrinsicElements['group']) {
  const group = useRef<THREE.Group>(null!);
  const material = useRef<
    THREE.ShaderMaterial & { time: number; pulse: number; color: THREE.Color }
  >(null!);

  // Brain geometry with seed-based deformation
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    const rnd = createSeededRandom(seed);
    const position = geo.attributes.position as THREE.BufferAttribute;
    const temp = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      temp.fromBufferAttribute(position, i);
      const deform = rnd() * 0.3;
      temp.addScaledVector(temp.normalize(), deform);
      position.setXYZ(i, temp.x, temp.y, temp.z);
    }
    position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [seed]);

  // Particle halo
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const rnd = createSeededRandom(seed + 1);
    const positions = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
      const vec = new THREE.Vector3().randomDirection();
      const radius = 1.5 + rnd() * 0.5;
      vec.multiplyScalar(radius);
      positions.set([vec.x, vec.y, vec.z], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [particles, seed]);

  useFrame((_, delta) => {
    if (material.current) {
      material.current.time += delta;
      material.current.color = new THREE.Color(color);
      material.current.pulse = pulse;
    }
    if (group.current) {
      group.current.rotation.y += delta * 0.2;
      const scale = 1 + 0.05 * Math.sin(material.current.time * pulse);
      group.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={group} {...props}>
      <mesh geometry={geometry}>
        <fresnelMaterial
          ref={material as unknown as Ref<THREE.ShaderMaterial>}
        />
      </mesh>
      <points geometry={particleGeometry}>
        <pointsMaterial size={0.02} color={color} transparent opacity={0.6} />
      </points>
    </group>
  );
}

export default HoloBrain;
// [AURORA-END:three-holobrain]
