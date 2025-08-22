import { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControlsProps } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function PassiveOrbitControls({ makeDefault, enableDamping = true, ...props }: OrbitControlsProps) {
  const { camera, gl } = useThree();
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const controls = useMemo(() => new OrbitControlsImpl(camera), [camera]);

  useFrame(() => {
    if (controls.enabled) controls.update();
  }, -1);

  useEffect(() => {
    controls.connect(gl.domElement);
    return () => controls.dispose();
  }, [controls, gl]);

  useEffect(() => {
    const { _onMouseWheel: handler } = controls as OrbitControlsImpl & {
      _onMouseWheel: (event: WheelEvent) => void;
    };
    const element = gl.domElement;
    element.removeEventListener("wheel", handler);
    element.addEventListener("wheel", handler, { passive: true });
    return () => {
      element.removeEventListener("wheel", handler);
    };
  }, [controls, gl]);

  useEffect(() => {
    if (makeDefault) {
      const old = get().controls;
      // @ts-ignore
      set({ controls });
      return () => set({ controls: old });
    }
  }, [makeDefault, controls, set, get]);

  return controls ? (
    <primitive ref={controlsRef} object={controls} enableDamping={enableDamping} {...props} />
  ) : null;
}

