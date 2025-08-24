import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export default function WebGLContextManager() {
  const { gl } = useThree();
  useEffect(() => {
    const handleLost = (e: Event) => e.preventDefault();
    const handleRestored = () => {
      gl.resetState();
    };
    gl.domElement.addEventListener("webglcontextlost", handleLost);
    gl.domElement.addEventListener("webglcontextrestored", handleRestored);
    return () => {
      gl.domElement.removeEventListener("webglcontextlost", handleLost);
      gl.domElement.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl]);
  return null;
}
