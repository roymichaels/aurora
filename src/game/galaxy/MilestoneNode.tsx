import { useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface MilestoneNodeProps {
  position: THREE.Vector3;
  color: THREE.Color;
  index: number;
  active?: boolean;
  onClick?: (index: number) => void;
}

export function MilestoneNode({ position, color, index, active = false, onClick }: MilestoneNodeProps) {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.6;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(index);
  };

  const ringColor = color.clone().offsetHSL(0, -0.2, 0.15);

  return (
    <group position={position} onClick={handleClick}>
      <mesh ref={sphereRef} castShadow receiveShadow>
        <sphereGeometry args={[0.24, 48, 48]} />
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.4}
          emissive={color.clone().multiplyScalar(0.25)}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.006, 16, 64]} />
        <meshBasicMaterial color={ringColor} opacity={0.6} transparent />
      </mesh>
      {active && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.003, 16, 64]} />
          <meshBasicMaterial color={ringColor} opacity={0.45} transparent />
        </mesh>
      )}
    </group>
  );
}

export default MilestoneNode;

