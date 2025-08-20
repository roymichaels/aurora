
import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Stars, useCursor, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { useOnboardingStore } from "@/state/onboarding";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";

// ----- Types -----
type NodeStatus = "locked" | "current" | "done";
type MapNode = {
  id: string;
  label: string;
  route: string;
  status: NodeStatus;
  color?: string;
};

// Luxe pastel palette
const palette = ["#8ab4ff", "#a987ff", "#ffb3a7", "#9ff3e0", "#ffd479", "#e6a8ff"];
const milestoneColor = (i: number) => palette[i % palette.length];

// Build nodes with a simple default set so the home galaxy works
// even when roadmap progress is unavailable
function useMapNodes(): { nodes: MapNode[]; currentIndex: number } {
  const nodes = useMemo(() => {
    const stub = [
      { id: "journal", label: "Journal", route: "/app/journal" },
      { id: "live", label: "Live", route: "/app/live" },
      { id: "settings", label: "Settings", route: "/app/settings" },
    ];
    return stub.map((n, i) => ({
      ...n,
      status: i === 0 ? "current" : "locked",
      color: milestoneColor(i),
    }));
  }, []);

  return { nodes, currentIndex: 0 };
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
  const [hovered, setHovered] = useState(false);
  const glow = node.status !== "locked";
  const isLocked = node.status === "locked";
  const isDone = node.status === "done";
  useCursor(hovered && !isLocked, 'pointer', 'not-allowed');
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.4;
  });

  const color = new THREE.Color(node.color!);
  const emissive = color.clone().multiplyScalar(node.status === "current" ? 0.25 : glow ? 0.12 : 0.02);

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={() => !isLocked && onClick(node)}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.28, 48, 48]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.35} emissive={emissive} />
      </mesh>

      {/* tiny ring for “premium” feel */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]} position={[0, -0.02, 0]}>
        <torusGeometry args={[0.38, 0.006, 16, 64]} />
        <meshBasicMaterial
          color={color.clone().offsetHSL(0, -0.2, 0.15)}
          opacity={isLocked ? 0.35 : isDone ? 0.5 : 0.55}
          transparent
        />
      </mesh>
    </group>
  );
}

// ----- Aurora follower (DOM overlay that tracks a 3D point) -----
function AuroraFollower({ target }: { target: React.MutableRefObject<THREE.Vector3 | null> }) {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (groupRef.current && target.current) {
      groupRef.current.position.copy(target.current);
    }
  });

  return (
    <group ref={groupRef}>
      <Html center transform>
        <div
          onClick={() => window.dispatchEvent(new CustomEvent("ui:openModal", { detail: "sphere-full" }))}
          style={{ pointerEvents: "auto" }}
        >
          <AuroraSphere size={64} />
        </div>
      </Html>
    </group>
  );
}

// ----- Scene -----
function GalaxyScene() {
  const { nodes } = useMapNodes();
  const pathPoints = useSpiralPositions(20);
  const nodePositions = useMemo(
    () =>
      nodes.map((_, i) =>
        pathPoints[
          Math.floor((i / Math.max(1, nodes.length - 1)) * (pathPoints.length - 1))
        ]
      ),
    [nodes, pathPoints]
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pathPoints), [pathPoints]);
  const curvePoints = useMemo(() => curve.getPoints(200), [curve]);
  const navigate = useNavigate();

  // Track the sphere’s world position for the Aurora overlay
  const sphereRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const { percent } = useRoadmapProgress();
  const progressRef = useRef(0);

  const onNodeClick = (n: MapNode) => {
    if (n.status === "locked") return;
    navigate(n.route);
  };

  // subtle floating camera motion and sphere progress
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }, dt) => {
    const time = clock.getElapsedTime();
    if (group.current) {
      group.current.position.y = Math.sin(time * 0.25) * 0.05;
    }
    const target = percent / 100;
    progressRef.current += (target - progressRef.current) * Math.min(1, dt * 3);
    curve.getPointAt(progressRef.current, sphereRef.current);
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
        <Line points={curvePoints} color="#fff" lineWidth={2} transparent opacity={0.35} />
        {nodes.map((n, i) => (
          <Planet key={n.id} node={n} position={nodePositions[i]} onClick={onNodeClick} />
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
      <AuroraFollower target={sphereRef} />
    </>
  );
}

export default function HomeGalaxy() {
  const hasRoadmap = useOnboardingStore((s) => s.hasRoadmap);

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
        {!hasRoadmap && <OnboardingOverlay />}
    </div>
  );
}

