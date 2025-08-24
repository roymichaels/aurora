import { useEffect, useRef } from "react";
import { useThree, useFrame, extend } from "@react-three/fiber";
import {
  OrbitControls as DreiOrbitControls,
  type OrbitControlsProps,
} from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function PassiveOrbitControls({
  makeDefault,
  enableDamping = true,
  ...props
}: OrbitControlsProps) {
  const { lov, ...safeProps } = props;
  useEffect(() => {
    extend({ OrbitControls: OrbitControlsImpl });
  }, []);
  const { camera, gl } = useThree();
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  // Update controls every frame so damping and auto-rotate work correctly
  useFrame(() => {
    controlsRef.current?.update();
  }, -1);

  // Rebind the wheel listener with `passive: true` to avoid blocking the main thread
  useEffect(() => {
    const controls = controlsRef.current as OrbitControlsImpl & {
      _onMouseWheel?: (event: WheelEvent) => void;
    };
    const handler = controls._onMouseWheel;
    if (!handler) return;
    const element = gl.domElement;
    element.removeEventListener("wheel", handler);
    element.addEventListener("wheel", handler, { passive: true });
    return () => element.removeEventListener("wheel", handler);
  }, [gl]);

  // Support Drei's `makeDefault` prop so the controls can be accessed via `useThree()`
  useEffect(() => {
    if (!makeDefault) return;
    const previous = get().controls;
    // @ts-expect-error - the three fiber typings don't include our custom controls
    set({ controls: controlsRef.current });
    return () => set({ controls: previous });
  }, [makeDefault, set, get]);

  return (
      <DreiOrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping={enableDamping}
      makeDefault={makeDefault}
      {...safeProps}
    />
  );
}

