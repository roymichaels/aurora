import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  OrbitControls as DreiOrbitControls,
  OrbitControlsProps,
} from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function PassiveOrbitControls(props: OrbitControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { gl } = useThree();

  useEffect(() => {
    const controls = controlsRef.current as (OrbitControlsImpl & {
      _onMouseWheel: (event: WheelEvent) => void;
    }) | null;
    if (!controls) return;
    const { _onMouseWheel: handler } = controls;
    const element = gl.domElement;
    element.removeEventListener("wheel", handler);
    element.addEventListener("wheel", handler, { passive: true });
    return () => {
      element.removeEventListener("wheel", handler);
    };
  }, [gl]);

  return <DreiOrbitControls ref={controlsRef} {...props} />;
}
