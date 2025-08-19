import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import PlanetNode, { NodeStatus } from "@/components/roadmap/PlanetNode";
import { useRoadmapStore } from "@/state/roadmapStore";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { milestoneColor } from "@/game/galaxy/palette";

function useSpiralPositions(count: number) {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 1.5;
    const rise = -0.5;
    const baseR = 2.5;
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const ang = t * turns * Math.PI * 2;
      const r = baseR + t * 1.75;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = t * rise * count;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [count]);
}

interface TaskNode {
  id: string;
  title: string;
  status: NodeStatus;
  position: THREE.Vector3;
  color: THREE.Color;
}

function useTaskNodes() {
  const goals = useRoadmapStore((s) => s.goals);
  const progress = useRoadmapProgress();
  const goalPositions = useSpiralPositions(goals.length);
  const taskNodes: TaskNode[] = [];
  const taskPosMap = new Map<string, THREE.Vector3>();

  goals.forEach((g, gi) => {
    const goalPos = goalPositions[gi] ?? new THREE.Vector3();
    const sprintCount = g.sprints.length || 1;
    g.sprints.forEach((s, si) => {
      const angle = (si / sprintCount) * Math.PI * 2;
      const radius = 2.2;
      const sprintPos = new THREE.Vector3(
        goalPos.x + Math.cos(angle) * radius,
        goalPos.y + Math.sin(angle * 0.5) * 0.8,
        goalPos.z + Math.sin(angle) * radius
      );
      const taskCount = s.tasks.length || 1;
      s.tasks.forEach((t, ti) => {
        const tAngle = (ti / taskCount) * Math.PI * 2;
        const tRadius = 0.6;
        const taskPos = new THREE.Vector3(
          sprintPos.x + Math.cos(tAngle) * tRadius,
          sprintPos.y + Math.sin(tAngle * 0.5) * 0.25,
          sprintPos.z + Math.sin(tAngle) * tRadius
        );
        taskPosMap.set(t.id, taskPos);
        const index = progress.items.findIndex((it) => it.id === t.id);
        const status: NodeStatus =
          index === -1
            ? "locked"
            : index < progress.currentIndex
            ? "done"
            : index === progress.currentIndex
            ? "current"
            : "locked";
        const color = new THREE.Color(milestoneColor(taskNodes.length));
        taskNodes.push({ id: t.id, title: t.title, position: taskPos, status, color });
      });
    });
  });

  const currentTask = progress.items[progress.currentIndex];
  const currentPos = currentTask ? taskPosMap.get(currentTask.id) : undefined;
  return { taskNodes, currentPos } as const;
}

function AuroraFollower({ target }: { target: React.MutableRefObject<THREE.Vector3 | null> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && target.current) {
      groupRef.current.position.copy(target.current);
    }
  });

  const open = () => {
    window.dispatchEvent(new CustomEvent("ui:openModal", { detail: "sphere-full" }));
  };

  return (
    <group ref={groupRef}>
      <Html center>
        <div onClick={open} style={{ pointerEvents: "auto" }}>
          <AuroraSphere size={64} />
        </div>
      </Html>
    </group>
  );
}

function GalaxyScene() {
  const { taskNodes, currentPos } = useTaskNodes();
  const currentRef = useRef<THREE.Vector3 | null>(currentPos ?? null);
  useFrame(() => {
    currentRef.current = currentPos ?? null;
  });

  const onClick = (n: TaskNode) => {
    if (n.status === "locked") return;
    // Placeholder for navigation
  };

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2.5, 2, 2.5]} intensity={1.2} color="#7bc4ff" />
      <pointLight position={[-3, -2, -2]} intensity={0.8} color="#ff9eb8" />
      <Stars radius={60} depth={40} count={2000} factor={3} saturation={0.2} fade speed={0.4} />
      <Environment preset="night" />
      {taskNodes.map((n) => (
        <PlanetNode key={n.id} position={n.position} color={n.color} status={n.status} onClick={() => onClick(n)} />
      ))}
      <OrbitControls makeDefault enablePan={false} enableZoom zoomSpeed={0.6} rotateSpeed={0.6} minDistance={3.2} maxDistance={12} />
      <AuroraFollower target={currentRef} />
    </>
  );
}

export default function RoadmapGalaxy() {
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
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 1.6, 8] }}
        style={{ width: "100%", height: "64svh" }}
      >
        <GalaxyScene />
      </Canvas>
    </div>
  );
}
