import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  useAvatarStore,
  type AvatarMood,
  type AvatarMilestone,
} from '@/state/avatar';

interface Props {
  size?: number;
}

export function AvatarSphere({ size = 96 }: Props) {
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
      if (analyserRef.current && meshRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
        const level = sum / data.length / 128;
        const time = performance.now() * 0.001;
        const mood = moodRef.current;
        const milestone = milestoneRef.current;
        let scale = 1 + level * 0.3;
        if (milestone === 'goal') {
          scale *= 1 + Math.sin(time * 6) * 0.2;
        } else if (milestone === 'streak') {
          const streakAmt = Math.min(streakRef.current, 10) / 10;
          scale *= 1 + Math.sin(time * 2) * 0.1 * streakAmt;
        }
        if (mood === 'focused') {
          meshRef.current.rotation.y += 0.02;
        } else if (mood === 'relaxed') {
          meshRef.current.rotation.y += 0.005;
          scale *= 1 + Math.sin(time) * 0.05;
        }
        meshRef.current.scale.setScalar(scale);
      }
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

  // Update color based on sentiment
  useEffect(() => {
    if (!matRef.current) return;
    const neg = new THREE.Color('#ff4d4d');
    const pos = new THREE.Color('#4dff4d');
    const t = (sentiment + 1) / 2; // -1..1 -> 0..1
    const color = new THREE.Color().lerpColors(neg, pos, t);
    matRef.current.color.copy(color);
  }, [sentiment]);

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
        matRef.current.emissiveIntensity = 0.5;
        matRef.current.wireframe = false;
        break;
      case 'streak':
        matRef.current.emissiveIntensity = 0.2;
        matRef.current.wireframe = true;
        break;
      default:
        matRef.current.emissiveIntensity = 0;
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
