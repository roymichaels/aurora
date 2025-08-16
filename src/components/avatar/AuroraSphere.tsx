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

const shaderConfig = {
  speed: 0.6,
  noiseDensity: 2.0,
  noiseStrength: 0.15,
  frequency: 6.0,
  amplitude: 0.3,
  intensity: 1.0,
};
/**
 * AuroraSphere
 *
 * Combines behaviour from the legacy AvatarSphere, ReactiveSphere and
 * EvolvingSphere components.  Uses WebGPU when available and falls back to
 * a traditional Three.js WebGLRenderer otherwise.
 */
export function AuroraSphere({
  size = 44,
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
      uSpeed: { value: shaderConfig.speed },
      uNoiseDensity: { value: shaderConfig.noiseDensity },
      uNoiseStrength: { value: shaderConfig.noiseStrength },
      uFrequency: { value: shaderConfig.frequency },
      uAmplitude: { value: shaderConfig.amplitude },
      uIntensity: { value: shaderConfig.intensity },
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

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float pnoise(vec3 P, vec3 rep) {
        vec3 Pi0 = mod(floor(P), rep);
        vec3 Pi1 = mod(Pi0 + 1.0, rep);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - 1.0;
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = vec4(Pi0.zz);
        vec4 iz1 = vec4(Pi1.zz);

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
        vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
        vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
        vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
        vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
        vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
        vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
        vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.y, Pf0.z));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.x, Pf1.y, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.x, Pf0.y, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.y, Pf1.z));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
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
        float distortion = pnoise(normal + t, vec3(10.0) * uNoiseDensity) * uNoiseStrength;

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

      vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
      }

      void main() {
        float distort = vDistort * uIntensity;
        vec3 color = cosPalette(distort,
          vec3(0.5),
          vec3(0.5),
          vec3(1.0),
          vec3(0.0, 0.1, 0.2)
        );
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

