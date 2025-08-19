import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type NodeStatus = "locked" | "current" | "done";

export interface PlanetNodeProps {
  position: THREE.Vector3;
  color: THREE.Color;
  status: NodeStatus;
  onClick?: () => void;
}

export function PlanetNode({ position, color, status, onClick }: PlanetNodeProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const isLocked = status === "locked";
  const isDone = status === "done";

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.4;
  });

  const emissive = color.clone().multiplyScalar(status === "current" ? 0.3 : isLocked ? 0.05 : 0.15);

  return (
    <group position={position}>
      <mesh ref={ref} onClick={() => !isLocked && onClick?.()} castShadow receiveShadow>
        <sphereGeometry args={[0.28, 48, 48]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.35} emissive={emissive} />
      </mesh>
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

export default PlanetNode;
