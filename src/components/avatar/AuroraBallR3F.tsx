import * as THREE from 'three';
import { forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export type AuroraBallProps = JSX.IntrinsicElements['group'] & { size?: number };

function AuroraBallR3F({ size = 1, ...props }: AuroraBallProps, ref: React.Ref<THREE.Group>) {
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 5), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: 0.6 },
          uNoiseDensity: { value: 2.0 },
          uNoiseStrength: { value: 0.15 },
          uFrequency: { value: 6.0 },
          uAmplitude: { value: 0.3 },
          uIntensity: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uNoiseDensity;
uniform float uNoiseStrength;
uniform float uAmplitude;

varying float vNoise;

float hash(vec3 p){
  p = vec3(dot(p,vec3(127.1,311.7,74.7)),
           dot(p,vec3(269.5,183.3,246.1)),
           dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p.x+p.y+p.z)*43758.5453123);
}

float noise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  float n = mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                  f.z);
  return n;
}

void main(){
  float t = uTime * uSpeed;
  vec3 pos = position;
  float n = noise(pos * uNoiseDensity + t) * uAmplitude;
  vNoise = n;
  pos += normal * n * uNoiseStrength;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}
`,
        fragmentShader: /* glsl */ `
uniform float uFrequency;
uniform float uIntensity;

varying float vNoise;

vec3 cosPalette(float t){
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.263,0.416,0.557);
  return a + b * cos(6.28318 * (c * t + d));
}

void main(){
  vec3 color = cosPalette(vNoise * uFrequency) * uIntensity;
  gl_FragColor = vec4(color,1.0);
}
`,
      }),
    []
  );

  useFrame(({ clock }) => {
    (material.uniforms.uTime as THREE.IUniform<number>).value = clock.getElapsedTime();
  });

  return (
    <group ref={ref} scale={size} {...props}>
      <mesh geometry={geometry} material={material} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.08, 64]} />
        <meshBasicMaterial opacity={0.2} transparent />
      </mesh>
    </group>
  );
}

export default forwardRef<THREE.Group, AuroraBallProps>(AuroraBallR3F);
