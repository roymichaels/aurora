import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// three@0.179 ships WebGPU in the core build under the `three/webgpu` entry.
// Importing from examples would fail since that path is not packaged.
import { WebGPURenderer } from 'three/webgpu';
import { useAvatarStore } from '@/state/avatar';
import { useVoiceStore } from '@/state/voice';
import { createHalo } from './auroraSphereHalo';
import './aurora-sphere.css';

export type AuroraMood = 'calm' | 'focused' | 'confident' | 'stressed';

interface Props {
  size?: number;
  className?: string;
  level?: number;
  xpPct?: number;
  mood?: AuroraMood;
  speaking?: boolean;
  progress?: number;
}

/**
 * AuroraSphere
 *
 * Combines behaviour from the legacy AvatarSphere, ReactiveSphere and
 * EvolvingSphere components.  Uses WebGPU when available and falls back to
 * a traditional Three.js WebGLRenderer otherwise.
 */
export function AuroraSphere({
  size = 64,
  className,
  level = 1,
  xpPct = 0,
  mood,
  speaking,
  progress = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number>(0);

  // pull defaults from global stores
  const audio = useAvatarStore((s) => s.audio);
  const voiceSpeaking = useVoiceStore((s) => s.isSpeaking);

  const speakingRef = useRef(speaking ?? voiceSpeaking);
  const levelRef = useRef(level);

  useEffect(() => {
    speakingRef.current = speaking ?? voiceSpeaking;
  }, [speaking, voiceSpeaking]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);


  // attach analyser for audio driven scale
  useEffect(() => {
    if (!speakingRef.current || !audio) {
      analyserRef.current = null;
      return;
    }
    try {
      const Ctx =
        (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext);
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    } catch {
      analyserRef.current = null;
    }
    return () => {
      analyserRef.current = null;
    };
  }, [audio, speaking, voiceSpeaking]);

  // setup renderer/scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3;

    let renderer: THREE.WebGLRenderer | WebGPURenderer;
    if ('gpu' in navigator) {
      renderer = new WebGPURenderer({ antialias: true, alpha: true });
      // WebGPURenderer requires async init
      (renderer as WebGPURenderer).init().catch(() => {});
    } else {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    }
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1, 5);

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 0.6 },
      uNoiseDensity: { value: 2.0 },
      uNoiseStrength: { value: 0.15 },
      uFrequency: { value: 6.0 },
      uAmplitude: { value: 0.3 },
      uIntensity: { value: 1.0 },
    };

    const vertexShader = /* glsl */`
      varying vec3 vNormal;
      varying float vDistort;

      uniform float uTime;
      uniform float uSpeed;
      uniform float uNoiseDensity;
      uniform float uNoiseStrength;
      uniform float uFrequency;
      uniform float uAmplitude;

      // simplex noise from https://github.com/ashima/webgl-noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                      dot(p2,x2), dot(p3,x3) ) );
      }

      vec3 rotateY(vec3 v, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        mat3 m = mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
        );
        return m * v;
      }

      void main() {
        float t = uTime * uSpeed;
        float distortion = snoise(normal * uNoiseDensity + t) * uNoiseStrength;

        vec3 pos = position + normal * distortion;

        float angle = sin(uv.y * uFrequency + t) * uAmplitude;
        pos = rotateY(pos, angle);

        vNormal = normal;
        vDistort = distortion;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = /* glsl */`
      varying float vDistort;

      uniform float uIntensity;

      void main() {
        float distort = vDistort * uIntensity;
        vec3 color = vec3(distort);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    materialRef.current = material;
    scene.add(mesh);

    const halo = createHalo();
    haloRef.current = halo;
    scene.add(halo);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 0, 4);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const data = new Uint8Array(1024);
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const mesh = meshRef.current;
      const mat = materialRef.current;
      const halo = haloRef.current;
      if (!mesh || !mat || !halo) return;

      let scale = 1;
      let levelAmp = 0;
      if (speakingRef.current && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        levelAmp = sum / data.length / 128;
        scale += levelAmp;
      } else {
        // subtle pulse when idle/thinking
        scale = 1 + Math.sin(performance.now() * 0.005) * 0.05;
      }
      mesh.scale.setScalar(scale);
      const haloScale = 1.2 + levelAmp * 0.6;
      halo.scale.setScalar(haloScale);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.25 + levelAmp * 0.5;

      // update shader time
      mat.uniforms.uTime.value = performance.now() / 1000;

      // slow rotation influenced by level
      mesh.rotation.y += 0.002 * levelRef.current;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`aurora-sphere-container ${className ?? ''}`}
      style={{ width: size, height: size, ['--progress' as string]: progress }}
    >
      <div className="aurora-sphere-ring" />
      <div ref={mountRef} className="aurora-sphere-mount" />
    </div>
  );
}

export default AuroraSphere;

