import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stars } from "@react-three/drei";
import GalaxyPath from "@/game/galaxy/GalaxyPath";

export default function HomeGalaxy() {
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
        gl={{ antialias: true }}
        camera={{ fov: 60, position: [0, 0, 8] }}
        style={{ width: "100%", height: "64svh" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[2, 2, 2]} intensity={1.2} />
        <Stars
          radius={50}
          depth={40}
          count={1200}
          factor={3}
          saturation={0.2}
          fade
          speed={0.4}
        />
        <Environment preset="night" />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          zoomSpeed={0.6}
          rotateSpeed={0.6}
          minDistance={3.2}
          maxDistance={8}
        />
        <GalaxyPath />
      </Canvas>
    </div>
  );
}

