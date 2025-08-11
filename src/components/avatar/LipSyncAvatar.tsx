import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAvatarStore } from "@/state/avatar";
import { useVoiceStore } from "@/state/voice";

type Props = {
  size?: number;
};

export function LipSyncAvatar({ size = 96 }: Props) {
  const { enabled, color, audio } = useAvatarStore();
  const emotion = useVoiceStore((s) => s.emotion);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Setup three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(size, size);

    const headMat = new THREE.MeshStandardMaterial({ color });
    matRef.current = headMat;
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), headMat);
    scene.add(head);

    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    mouth.position.y = -0.3;
    head.add(mouth);
    mouthRef.current = mouth;

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 1, 2);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    let frame: number;
    const data = new Uint8Array(1024);
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const analyser = analyserRef.current;
      if (analyser && mouthRef.current) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += Math.abs(data[i] - 128);
        }
        const level = sum / data.length / 128; // 0..1
        mouthRef.current.scale.y = 1 + level * 2;
      }
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [color, size]);

  // Attach audio analyser when audio changes
  useEffect(() => {
    if (!audio) {
      analyserRef.current = null;
      return;
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    return () => {
      try { source.disconnect(); } catch {}
      try { analyser.disconnect(); } catch {}
      analyserRef.current = null;
    };
  }, [audio]);

  // Update material color based on emotion
  useEffect(() => {
    if (!matRef.current) return;
    const map: Record<string, string> = {
      happy: "#ffe066",
      sad: "#4d9bef",
      angry: "#ff6b6b",
    };
    matRef.current.color.set(map[emotion] || color);
  }, [emotion, color]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

