import { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import type { OrbitControlsProps } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function PassiveOrbitControls({ makeDefault, enableDamping = true, ...props }: OrbitControlsProps) {
  const { camera, gl } = useThree();
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);

  // Create the controls instance once for the current camera
  const controls = useMemo(() => new OrbitControlsImpl(camera), [camera]);
  const controlsRef = useRef<OrbitControlsImpl>(controls);

  // Update the controls every frame so damping and auto-rotate work correctly
  useFrame(() => {
    controls.update();
  }, -1);

  // Attach controls to the WebGL context and dispose on unmount
  useEffect(() => {
    controls.connect(gl.domElement);
    return () => controls.dispose();
  }, [controls, gl]);

  // Rebind the wheel listener with `passive: true` to avoid blocking the main thread
  useEffect(() => {
    const handler = (
      controls as OrbitControlsImpl & {
        _onMouseWheel?: (event: WheelEvent) => void;
      }
    )._onMouseWheel;
    if (!handler) {
      console.warn(
        "PassiveOrbitControls: _onMouseWheel handler not found; skipping wheel listener rebind."
      );
      return;
    }
    const element = gl.domElement;
    element.removeEventListener("wheel", handler);
    element.addEventListener("wheel", handler, { passive: true });
    return () => element.removeEventListener("wheel", handler);
  }, [controls, gl]);

  // Support Drei's `makeDefault` prop so the controls can be accessed via `useThree()`
  useEffect(() => {
    if (!makeDefault) return;
    const previous = get().controls;
    // @ts-ignore - the three fiber typings don't include our custom controls
    set({ controls });
    return () => set({ controls: previous });
  }, [makeDefault, controls, set, get]);

  // Only render the primitive once controls have been instantiated
  return controls ? <primitive ref={controlsRef} object={controls} enableDamping={enableDamping} {...props} /> : null;
}

