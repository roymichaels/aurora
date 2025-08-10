import { useRef, useEffect } from "react";
import * as THREE from "three";

interface Props {
  size?: number; // size in pixels
  className?: string;
}

export function HypnoSphere({ size = 256, className = "" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(10, 64, 64);
    const material = new THREE.PointsMaterial({ color: 0x666666, size: 0.25 });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const light = new THREE.PointLight(0xffffff, 2);
    light.position.y = 10;
    scene.add(light);

    let frameId: number;
    const animate = () => {
      particles.rotation.y += 0.002;
      const scale = 1 + 0.1 * Math.sin(Date.now() * 0.002);
      particles.scale.set(scale, scale, scale);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} className={className} style={{ width: size, height: size }} />;
}

export default HypnoSphere;
