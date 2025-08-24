import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
// three@0.179 ships WebGPU in the core build under `three/webgpu`
import { WebGPURenderer, MeshStandardNodeMaterial } from 'three/webgpu';
import {
  vec3,
  float,
  uv,
  time,
  positionLocal,
  normalLocal,
  rotate,
  triNoise3D,
  cameraPosition,
  positionWorld,
  normalWorld,
} from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { useAvatarStore } from '@/state/avatar';
import { useVoiceStore } from '@/state/voice';
import { useUIStore } from '@/state/ui';
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
  noiseStrength?: number;
  amplitude?: number;
  intensity?: number;
  variant?: 'inline' | 'full';
  interactive?: boolean;
}

const defaultShaderConfig = {
  speed: 0.6,
  noiseDensity: 2.0,
  noiseStrength: 0.15,
  frequency: 6.0,
  amplitude: 0.3,
  intensity: 1.0,
};

/**
 * AuroraSphere
 * Uses Kay's periodic-noise blob + sine banding + CosPalette coloring.
 * WebGPU if available, else WebGL.
 */
export function AuroraSphere({
  size = 44,
  className,
  level = 1,
  xpPct = 0, // reserved for future tinting
  mood,
  speaking,
  progress = 0,
  noiseStrength = defaultShaderConfig.noiseStrength,
  amplitude = defaultShaderConfig.amplitude,
  intensity = defaultShaderConfig.intensity,
  variant = 'inline',
  interactive,
}: Props) {
  const shaderConfig = useMemo(
    () => ({
      ...defaultShaderConfig,
      noiseStrength,
      amplitude,
      intensity,
    }),
    [noiseStrength, amplitude, intensity]
  );
  const isInteractive = interactive || variant === 'full';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const pointsMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const materialRef = useRef<MeshStandardNodeMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | WebGPURenderer | null>(
    null
  );
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);

  // global stores
  const audio = useAvatarStore((s) => s.audio);
  const voiceSpeaking = useVoiceStore((s) => s.isSpeaking);

  const speakingRef = useRef(speaking ?? voiceSpeaking);
  const levelRef = useRef(level);

  useEffect(() => { speakingRef.current = speaking ?? voiceSpeaking; }, [speaking, voiceSpeaking]);
  useEffect(() => { levelRef.current = level; }, [level]);

  useEffect(() => {
    const mat = materialRef.current;
    if (mat) {
      (mat.uniforms.uNoiseStrength as THREE.IUniform<number>).value = noiseStrength;
      (mat.uniforms.uAmplitude as THREE.IUniform<number>).value = amplitude;
      (mat.uniforms.uIntensity as THREE.IUniform<number>).value = intensity;
    }
  }, [noiseStrength, amplitude, intensity]);

  // analyser for audio-driven scale
  useEffect(() => {
    if (!speakingRef.current || !audio) {
      analyserRef.current = null;
      return;
    }
    try {
      const Ctx =
        (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!;
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

  // renderer/scene
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3;
    sceneRef.current = scene;
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer | WebGPURenderer | null = null;
    let geometry: THREE.IcosahedronGeometry | null = null;
    let material: MeshStandardNodeMaterial | null = null;
    let particleGeometry: THREE.BufferGeometry | null = null;
    let particleMaterial: THREE.PointsMaterial | null = null;
    let pmrem: THREE.PMREMGenerator | null = null;
    let envTexture: THREE.Texture | null = null;
    let hdrTexture: THREE.DataTexture | null = null;
    let handleContextLost: ((e: Event) => void) | null = null;
    let handleContextRestored: (() => void) | null = null;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    const data = new Uint8Array(1024);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const mesh = meshRef.current;
      const halo = haloRef.current;
      const mat = materialRef.current;
      const ptsMat = pointsMaterialRef.current;
      if (!mesh || !halo) return;

      let scale = 1;
      let levelAmp = 0;
      if (speakingRef.current && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        levelAmp = sum / data.length / 128;
        scale += levelAmp;
      } else {
        // subtle idle breathing
        scale = 1 + Math.sin(performance.now() * 0.005) * 0.05;
      }
      // keep uniform scaling (avoid "pancake")
      mesh.scale.setScalar(scale);
      const haloScale = 1.2 + levelAmp * 0.6;
      halo.scale.setScalar(haloScale);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.25 + levelAmp * 0.5;

      // shader time
      const time = performance.now() / 1000;
      if (mat?.uniforms?.uTime) {
        (mat.uniforms.uTime as THREE.IUniform<number>).value = time;
      }

      if (ptsMat) {
        ptsMat.size = 0.02 + Math.sin(time * 2.0) * 0.005 + levelAmp * 0.03;
        ptsMat.opacity = 0.3 + Math.sin(time) * 0.2 + levelAmp * 0.5;
      }

      if (!isInteractive) {
        // slow rotation influenced by level
        mesh.rotation.y += 0.002 * (levelRef.current || 1);
      }

      controlsRef.current?.update();
      renderer?.render(scene, camera);
    };

    const start = async () => {
      // Prefer WebGPU when available; fall back to WebGL otherwise.
      const canUseWebGPU = 'gpu' in navigator;

      if (canUseWebGPU) {
        try {
          const r = new WebGPURenderer({ antialias: true, alpha: true });
          await r.init();
          if (!r.backend) throw new Error('backend not ready');
          renderer = r;
        } catch {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        }
      } else {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      }

      if (disposed || !renderer) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const debug = (renderer as THREE.WebGLRenderer).debug;
      if (debug) {
        debug.checkShaderErrors = true;
      }

      mount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      handleContextLost = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(frameRef.current);
      };
      handleContextRestored = () => {
        renderer.resetState();
        animate();
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      if (variant === 'full') {
        pmrem = new THREE.PMREMGenerator(
          renderer as THREE.WebGLRenderer
        );
        new RGBELoader().load('/env/hdr-small.hdr', (tex) => {
          hdrTexture = tex;
          tex.mapping = THREE.EquirectangularReflectionMapping;
          const env = pmrem!.fromEquirectangular(tex);
          envTexture = env.texture;
          scene.environment = envTexture;
        });
      }

      const resize = () => {
        if (disposed) return;
        const { clientWidth, clientHeight } = container;
        if (clientWidth === 0 || clientHeight === 0) {
          requestAnimationFrame(resize);
          return;
        }
        renderer!.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      };
      resize();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
      }

      geometry = new THREE.IcosahedronGeometry(1, variant === 'full' ? 7 : 5);

      material = new MeshStandardNodeMaterial();
      materialRef.current = material;

      const t = time.mul(shaderConfig.speed);
      const noise = triNoise3D(
        normalLocal.mul(shaderConfig.noiseDensity),
        float(shaderConfig.speed),
        time
      ).mul(shaderConfig.noiseStrength);

      const angle = uv().y.mul(shaderConfig.frequency).add(t).sin().mul(shaderConfig.amplitude);

      material.positionNode = rotate(
        positionLocal.add(normalLocal.mul(noise)),
        vec3(0, angle, 0)
      );

      const distort = noise.mul(shaderConfig.intensity);
      material.colorNode = float(0.5).add(
        vec3(0.5).mul(
          vec3(1.0)
            .mul(distort)
            .add(vec3(0.0, 0.1, 0.2))
            .mul(6.28318)
            .cos()
        )
      );

      const viewDir = cameraPosition.sub(positionWorld).normalize();
      const rim = float(1)
        .sub(normalWorld.normalize().dot(viewDir).max(float(0)))
        .pow(float(3));
      material.emissiveNode = vec3(0xb6 / 255, 0xe1 / 255, 1.0)
        .mul(rim)
        .mul(float(0.8));

      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh;
      scene.add(mesh);

      // particle shell
      const particleCount = 1000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const r = 1 + Math.random() * 0.2;
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        positions.set([x, y, z], i * 3);
      }
      particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      pointsRef.current = particles;
      pointsMaterialRef.current = particleMaterial;
      scene.add(particles);

      const halo = createHalo();
      haloRef.current = halo;
      scene.add(halo);

      // physically sensible lights
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(2, 3, 4);
      scene.add(dir);
      scene.add(new THREE.AmbientLight(0xffffff, 0.35));

      if (isInteractive && renderer) {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controlsRef.current = controls;
      }

      animate();
    };

    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameRef.current);
      controlsRef.current?.dispose();
      controlsRef.current = null;
      resizeObserver?.disconnect();
      geometry?.dispose();
      material?.dispose();
      materialRef.current = null;
      if (pointsRef.current) {
        scene.remove(pointsRef.current);
      }
      particleGeometry?.dispose();
      if (!(renderer instanceof WebGPURenderer)) {
        try {
          particleMaterial?.dispose();
        } catch {
          /* ignore */
        }
      }
      haloRef.current?.geometry.dispose();
      (haloRef.current?.material as THREE.Material | undefined)?.dispose();
      hdrTexture?.dispose();
      envTexture?.dispose();
      pmrem?.dispose();
      scene.environment = null;
      if (renderer) {
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost!);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored!);
      }
      try {
        renderer?.dispose?.();
      } catch {
        /* ignore */
      }
      if (renderer && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      pointsRef.current = null;
      pointsMaterialRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [shaderConfig, isInteractive, variant]);

  const handleClick = () => {
    if (variant === 'inline') {
      useUIStore.getState().openModal('sphereFull');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`aurora-sphere-container ${className ?? ''}`}
      style={{
        width: variant === 'inline' ? size : '100%',
        height: variant === 'inline' ? size : '100%',
        '--progress': progress,
      } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className="aurora-sphere-ring" />
      <div ref={mountRef} className="aurora-sphere-mount" />
    </div>
  );
}

export default AuroraSphere;
