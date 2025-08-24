import { useEffect, useRef } from "react";
import { useThree, useFrame, extend, ReactThreeFiber } from "@react-three/fiber";
import type { OrbitControlsProps } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

extend({ OrbitControls: OrbitControlsImpl });

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<
        OrbitControlsImpl,
        typeof OrbitControlsImpl
      >;
    }
  }
}

export default function PassiveOrbitControls({ makeDefault, enableDamping = true, ...props }: OrbitControlsProps) {
  const { camera, gl } = useThree();
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  // Update the controls every frame so damping and auto-rotate work correctly
  useFrame(() => {
    controlsRef.current?.update();
  }, -1);

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
  }, [gl]);

  // Support Drei's `makeDefault` prop so the controls can be accessed via `useThree()`
  useEffect(() => {
    if (!makeDefault) return;
    const previous = get().controls;
    // @ts-ignore - the three fiber typings don't include our custom controls
    set({ controls: controlsRef.current });
    return () => set({ controls: previous });
  }, [makeDefault, set, get]);

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping={enableDamping}
      {...props}
    />
  );
}

