import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  useAvatarStore,
  type AvatarMood,
  type AvatarMilestone,
} from '@/state/avatar';

interface Props {
  size?: number;
  isThinking?: boolean;
  isSpeaking?: boolean;
  progressPercent?: number;
}

export function AvatarSphere({
  size = 96,
  isThinking = false,
  isSpeaking = false,
  progressPercent = 0,
}: Props) {
  const { enabled, sentiment, audio, mood, milestone, streak } = useAvatarStore();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const geomRef = useRef<THREE.IcosahedronGeometry | null>(null);
  const basePositions = useRef<Float32Array | null>(null);
  const moodRef = useRef<AvatarMood>('neutral');
  const milestoneRef = useRef<AvatarMilestone>('none');
  const streakRef = useRef<number>(0);
  const thinkingRef = useRef(isThinking);
  const speakingRef = useRef(isSpeaking);
  const progressRef = useRef(progressPercent);
  const reduceMotion = useRef(false);

  useEffect(() => {
    thinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    progressRef.current = progressPercent;
  }, [progressPercent]);

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Setup scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !enabled) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1, 5);
    geomRef.current = geometry;
    basePositions.current = geometry.attributes.position.array.slice() as Float32Array;
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
    matRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 0, 4);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const data = new Uint8Array(1024);
    let frame: number;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const mesh = meshRef.current;
      const material = matRef.current;
      if (!mesh || !material) {
        renderer.render(scene, camera);
        return;
      }

      let level = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        level = sum / data.length / 128;
      }

      const time = performance.now() * 0.001;
      let scale = 1 + level * 0.3;
      let emissive = speakingRef.current ? 0.4 : 0;
      const rm = reduceMotion.current;
      const mood = moodRef.current;
      const milestone = milestoneRef.current;

      if (milestone === 'goal') {
        emissive = Math.max(emissive, 0.5);
      } else if (milestone === 'streak') {
        emissive = Math.max(emissive, 0.2);
      }

      if (!rm) {
        if (milestone === 'goal') {
          scale *= 1 + Math.sin(time * 6) * 0.2;
        } else if (milestone === 'streak') {
          const streakAmt = Math.min(streakRef.current, 10) / 10;
          scale *= 1 + Math.sin(time * 2) * 0.1 * streakAmt;
        }
        if (mood === 'focused') {
          mesh.rotation.y += 0.02;
        } else if (mood === 'relaxed') {
          mesh.rotation.y += 0.005;
          scale *= 1 + Math.sin(time) * 0.05;
        }
        if (thinkingRef.current) {
          scale *= 1 + Math.sin(time * 2) * 0.05;
        }
        if (speakingRef.current) {
          const pulse = Math.sin(time * 8) * 0.1;
          scale *= 1 + pulse;
          emissive += 0.2 * Math.sin(time * 8);
        }
      }

      mesh.scale.setScalar(scale);
      material.emissiveIntensity = emissive;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [enabled, size]);

  // Attach audio analyser
  useEffect(() => {
    if (!audio) {
      analyserRef.current = null;
      return;
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    return () => {
      try { src.disconnect(); } catch {}
      try { analyser.disconnect(); } catch {}
      analyserRef.current = null;
    };
  }, [audio]);

  // Update color based on sentiment and progress
  useEffect(() => {
    if (!matRef.current) return;
    const neg = new THREE.Color('#ff4d4d');
    const pos = new THREE.Color('#4dff4d');
    const t = (sentiment + 1) / 2; // -1..1 -> 0..1
    const base = new THREE.Color().lerpColors(neg, pos, t);
    const p = Math.max(0, Math.min(progressRef.current, 100)) / 100;
    const tint = new THREE.Color().setHSL(p * 0.4, 0.7, 0.5);
    base.lerp(tint, 0.25);
    matRef.current.color.copy(base);
  }, [sentiment, progressPercent]);

  // Distort geometry based on sentiment
  useEffect(() => {
    const geom = geomRef.current;
    const base = basePositions.current;
    if (!geom || !base) return;
    const pos = geom.attributes.position.array as Float32Array;
    const amt = sentiment * 0.3;
    for (let i = 0; i < pos.length; i += 3) {
      const nx = base[i];
      const ny = base[i + 1];
      const nz = base[i + 2];
      const noise = Math.sin(nx * 3) + Math.sin(ny * 3) + Math.sin(nz * 3);
      const factor = 1 + amt * noise;
      pos[i] = nx * factor;
      pos[i + 1] = ny * factor;
      pos[i + 2] = nz * factor;
    }
    geom.computeVertexNormals();
    geom.attributes.position.needsUpdate = true;
  }, [sentiment]);

  // React to avatar mood
  useEffect(() => {
    moodRef.current = mood;
    if (!matRef.current) return;
    switch (mood) {
      case 'focused':
        matRef.current.emissive.set('#3366ff');
        break;
      case 'relaxed':
        matRef.current.emissive.set('#00ffff');
        break;
      default:
        matRef.current.emissive.set('#000000');
    }
  }, [mood]);

  // React to milestone changes
  useEffect(() => {
    milestoneRef.current = milestone;
    if (!matRef.current) return;
    switch (milestone) {
      case 'goal':
        matRef.current.wireframe = false;
        break;
      case 'streak':
        matRef.current.wireframe = true;
        break;
      default:
        matRef.current.wireframe = false;
    }
  }, [milestone]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  if (!enabled) return null;
  return <div ref={mountRef} style={{ width: size, height: size }} />;
}

export default AvatarSphere;
