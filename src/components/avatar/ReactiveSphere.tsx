import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { bus } from "@/utils/bus";
import { useAvatarStore } from "@/state/avatar";

type SphereState = 'idle' | 'thinking' | 'speaking';


interface Props {
  size?: number;
  className?: string;
}
export function ReactiveSphere({ size = 48, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number>(0);
  const audio = useAvatarStore((s) => s.audio);
  const [state, setState] = useState<SphereState>('idle');

  // Setup WebGL scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2;

    const geom = new THREE.SphereGeometry(1, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 1, 2);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const data = new Uint8Array(1024);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      let scale = 1;

      if (state === 'speaking' && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += Math.abs(data[i] - 128);
        }
        const level = sum / data.length / 128;
        scale += level;
      } else if (state === 'thinking') {
        scale = 1 + Math.sin(performance.now() * 0.005) * 0.05;
      }

      mesh.scale.setScalar(scale);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
    };
  }, [size, state]);

  // Handle bus events
  useEffect(() => {

    const off = bus.on('sphere/state:set', ({ state }) => {
      setState(state);
      if (state === 'speaking' && audio) {
        attachAnalyser(audio);
      } else {
        cleanupAudio();
      }
    });
    return () => {
      off();
      cleanupAudio();
    };
  }, [audio]);

  const attachAnalyser = (el: HTMLAudioElement) => {
    cleanupAudio();
    try {
      const Ctx =
        (window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext);
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    } catch {
      analyserRef.current = null;
    }
  };

  const cleanupAudio = () => {
    analyserRef.current = null;
  };

  return <canvas ref={canvasRef} className={className} style={{ width: size, height: size }} />;
}

export default ReactiveSphere;
