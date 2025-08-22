import React, { useMemo, useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import MilestoneNode from "./MilestoneNode";
import AuroraBallR3F from "@/components/avatar/AuroraBallR3F";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { usePersonaStore } from "@/state/persona";
import type { UserProfile } from "@/data/profile";
import { milestoneColor } from "./palette";

function makeCurve() {
  const pts = [
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(-1, 0.5, -1.5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.5, -0.5, 1),
    new THREE.Vector3(2.5, 0.25, 0.5),
  ];
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
}

export default function GalaxyPath() {
  const curve = useMemo(makeCurve, []);
  const curvePoints = useMemo(() => curve.getPoints(200), [curve]);

  // Roadmap progress along the curve
  const { progressT, activeIndex } = useRoadmapProgress();

  // Milestone sampling
  const milestoneSamples = useMemo(() => {
    const count = 8;
    const samples: { position: THREE.Vector3; color: THREE.Color }[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const position = curve.getPointAt(t);
      const color = new THREE.Color(milestoneColor(i));
      samples.push({ position, color });
    }
    return samples;
  }, [curve]);

  // profile color update
  const updateProfile = usePersonaStore((s) => s.updateProfile);

  const handleMilestone = (index: number) => {
    const sample = milestoneSamples[index];
    if (!sample) return;
    updateProfile(
      { currentColor: sample.color.getHexString() } as unknown as Partial<UserProfile>,
    );
  };

  // Aurora avatar follower
  const sphereRef = useRef<THREE.Group>(null!);
  const tmp = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const t = Number.isFinite(progressT) ? progressT : 0;
    curve.getPointAt(t, tmp.current);
    if (sphereRef.current) {
      sphereRef.current.position.x = THREE.MathUtils.damp(
        sphereRef.current.position.x,
        tmp.current.x,
        5,
        dt,
      );
      sphereRef.current.position.y = THREE.MathUtils.damp(
        sphereRef.current.position.y,
        tmp.current.y,
        5,
        dt,
      );
      sphereRef.current.position.z = THREE.MathUtils.damp(
        sphereRef.current.position.z,
        tmp.current.z,
        5,
        dt,
      );
    }
  });

  return (
    <group>
      <Line points={curvePoints} color="#fff" lineWidth={2} transparent opacity={0.35} />
      {milestoneSamples.map((s, i) => (
        <MilestoneNode
          key={i}
          index={i}
          position={s.position}
          color={s.color}
          active={i === activeIndex}
          onClick={handleMilestone}
        />
      ))}
      <group ref={sphereRef}>
        <AuroraBallR3F size={0.6} />
      </group>
    </group>
  );
}

