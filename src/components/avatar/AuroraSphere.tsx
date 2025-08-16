import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// three@0.179 ships WebGPU in the core build under the `three/webgpu` entry.
// Importing from examples would fail since that path is not packaged.
import { WebGPURenderer } from 'three/webgpu';
import { useAvatarStore } from '@/state/avatar';
import { useVoiceStore } from '@/state/voice';

export type AuroraMood = 'calm' | 'focused' | 'confident' | 'stressed';

interface Props {
  size?: number;
  className?: string;
  level?: number;
  xpPct?: number;
  mood?: AuroraMood;
  speaking?: boolean;
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
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameRef = useRef<number>(0);

  // pull defaults from global stores
  const storeMood = useAvatarStore((s) => s.mood);
  const audio = useAvatarStore((s) => s.audio);
  const voiceSpeaking = useVoiceStore((s) => s.isSpeaking);

  const moodRef = useRef<AuroraMood>(mood ?? (storeMood as AuroraMood));
  const xpRef = useRef(xpPct);
  const speakingRef = useRef(speaking ?? voiceSpeaking);
  const levelRef = useRef(level);

  useEffect(() => {
    moodRef.current = mood ?? (storeMood as AuroraMood);
  }, [mood, storeMood]);

  useEffect(() => {
    xpRef.current = xpPct;
  }, [xpPct]);

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
  }, [audio, speakingRef.current]);

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
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    materialRef.current = material;
    scene.add(mesh);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 0, 4);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const data = new Uint8Array(1024);
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const mesh = meshRef.current;
      const mat = materialRef.current;
      if (!mesh || !mat) return;

      let scale = 1;
      if (speakingRef.current && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const levelAmp = sum / data.length / 128;
        scale += levelAmp;
      } else {
        // subtle pulse when idle/thinking
        scale = 1 + Math.sin(performance.now() * 0.005) * 0.05;
      }
      mesh.scale.setScalar(scale);

      // color from xp + mood
      const hue = 180 + Math.round((xpRef.current / 100) * 140); // 180..320
      const palettes: Record<AuroraMood, { s: number; l: number }> = {
        calm: { s: 65, l: 58 },
        focused: { s: 72, l: 55 },
        confident: { s: 80, l: 52 },
        stressed: { s: 85, l: 46 },
      };
      const p = palettes[moodRef.current] ?? palettes.calm;
      mat.color.set(`hsl(${hue}, ${p.s}%, ${p.l}%)`);

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

  return <div ref={mountRef} className={className} style={{ width: size, height: size }} />;
}

export default AuroraSphere;

