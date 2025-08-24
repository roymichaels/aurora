import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as OrbitControls } from "@react-three/drei";
import type { OrbitControlsProps } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function PassiveOrbitControls({
  args,
  enableDamping = true,
  makeDefault,
  ...props
}: OrbitControlsProps) {
  const { gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  // Update the controls every frame so damping and auto-rotate work correctly
  useFrame(() => {
    controlsRef.current?.update();
  }, -1);

  // Rebind the wheel listener with `passive: true` to avoid blocking the main thread
  useEffect(() => {
    const controls = controlsRef.current;
    const element = gl.domElement;
    if (!controls || !element) return;

    const handler = (
      controlsRef.current as OrbitControlsImpl & {
        _onMouseWheel?: (event: WheelEvent) => void;
      }
    )._onMouseWheel;
    if (!handler) {
      console.warn(
        "PassiveOrbitControls: _onMouseWheel handler not found; skipping wheel listener rebind."
      );
      return;
    }

    element.removeEventListener("wheel", handler);
    element.addEventListener("wheel", handler, { passive: true });
    return () => element.removeEventListener("wheel", handler);
  }, [controlsRef.current, gl.domElement]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={args}
      enableDamping={enableDamping}
      makeDefault={makeDefault}
      {...props}
    />
  );
}

