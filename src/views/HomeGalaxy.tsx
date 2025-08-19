import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";

// ----- Types -----
type NodeStatus = "locked" | "current" | "done";
type MapNode = {
  id: string;
  label: string;
  route: string;
  status: NodeStatus;
  color?: string;
};

// ----- Data (quick start; wire to real progress later) -----
const palette = ["#8ab4ff", "#a987ff", "#ffb3a7", "#9ff3e0", "#ffd479", "#e6a8ff"];

function useMapNodes(): MapNode[] {
  // Map your real modules/chapters here; these routes already exist in your app
  return [
    { id: "home", label: "Home", route: "/app", status: "done" },
    { id: "brain", label: "Brain", route: "/app/brain", status: "done" },
    { id: "journal", label: "Journal", route: "/app/journal", status: "current" },
    { id: "live", label: "Live", route: "/app/live", status: "locked" },
    { id: "settings", label: "Settings", route: "/app/settings", status: "locked" },
  ].map((n, i) => ({ ...n, color: palette[i % palette.length] }));
}

// ----- Spiral layout -----
function useSpiralPositions(count: number) {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 1.5;
    const rise = -0.35; // down the screen
    const baseR = 1.1;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const ang = t * turns * Math.PI * 2;
      const r = baseR + t * 1.25;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = t * rise * count; // sink a bit
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [count]);
}

// ----- Planet Node -----
function Planet({
  node,
  position,
  onClick,
}: {
  node: MapNode;
  position: THREE.Vector3;
  onClick: (n: MapNode) => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const glow = node.status !== "locked";
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.4;
  });

  const color = new THREE.Color(node.color!);
  const emissive = color.clone().multiplyScalar(node.status === "current" ? 0.25 : glow ? 0.12 : 0.02);

  return (
    <group position={position}>
      <mesh ref={ref} onClick={() => onClick(node)} castShadow receiveShadow>
        <sphereGeometry args={[0.28, 48, 48]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.35} emissive={emissive} />
      </mesh>

      {/* tiny ring for “premium” feel */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]} position={[0, -0.02, 0]}>
        <torusGeometry args={[0.38, 0.006, 16, 64]} />
        <meshBasicMaterial
          color={color.clone().offsetHSL(0, -0.2, 0.15)}
          opacity={0.55}
          transparent
        />
      </mesh>
    </group>
  );
}

// ----- Aurora follower (DOM overlay that tracks a 3D point) -----
function AuroraFollower({ target }: { target: React.MutableRefObject<THREE.Vector3 | null> }) {
  const { camera, size } = useThree();
  const [style, setStyle] = useState<React.CSSProperties>({ position: "absolute", left: -9999, top: -9999 });

  useFrame(() => {
    if (!target.current) return;
    const p = target.current.clone().project(camera);
    const x = (p.x * 0.5 + 0.5) * size.width;
    const y = (-p.y * 0.5 + 0.5) * size.height;
    setStyle({
      position: "absolute",
      left: x - 32, // center for size=64
      top: y - 32,
      pointerEvents: "auto",
    });
  });

  return (
    <div
      style={style}
      onClick={() => window.dispatchEvent(new CustomEvent("ui:openModal", { detail: "sphere-full" }))}
    >
      <AuroraSphere size={64} />
    </div>
  );
}

// ----- Scene -----
function GalaxyScene() {
  const nodes = useMapNodes();
  const positions = useSpiralPositions(nodes.length);
  const navigate = useNavigate();

  // Track the current node’s world position for the Aurora overlay
  const currentRef = useRef<THREE.Vector3 | null>(null);
  currentRef.current = positions[nodes.findIndex((n) => n.status === "current")] ?? positions[0];

  const onNodeClick = (n: MapNode) => {
    if (n.status === "locked") return;
    navigate(n.route);
  };

  // subtle floating camera motion
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.25) * 0.05;
    }
  });

  return (
    <>
      {/* Lights with a luxe, gamey vibe */}
      <ambientLight intensity={0.35} />
      <pointLight position={[2.5, 2, 2.5]} intensity={1.2} color="#7bc4ff" />
      <pointLight position={[-3, -2, -2]} intensity={0.8} color="#ff9eb8" />

      {/* Starfield & env */}
      <Stars radius={50} depth={40} count={1200} factor={3} saturation={0.2} fade speed={0.4} />
      <Environment preset="night" />

      <group ref={group}>
        {nodes.map((n, i) => (
          <Planet key={n.id} node={n} position={positions[i]} onClick={onNodeClick} />
        ))}
      </group>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        zoomSpeed={0.6}
        rotateSpeed={0.6}
        minDistance={3.2}
        maxDistance={8}
      />

      {/* Overlay that reuses your existing AuroraSphere */}
      <AuroraFollower target={currentRef} />
    </>
  );
}

export default function HomeGalaxy() {
  // Full-bleed, frosted-dusk background that matches your dark theme
  return (
    <div
      className="relative min-h-[60svh] rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 0%, rgba(104,118,175,.20) 0%, rgba(20,22,28,.92) 60%, rgba(14,14,18,1) 100%)",
        boxShadow: "0 20px 60px -20px rgba(0,0,0,.45)",
      }}
    >
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 1.6, 5.2] }}
        style={{ width: "100%", height: "64svh" }}
      >
        <GalaxyScene />
      </Canvas>
    </div>
  );
}

