import { useEffect, useRef } from "react";
import * as THREE from "three";
import AuroraSphere from "@/components/avatar/AuroraSphere";
// If you already have this hook, we’ll use it; otherwise we fall back to 0.1 progress.
let useRoadmapProgress: undefined | (() => { progress: number });
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useRoadmapProgress = require("@/hooks/useRoadmapProgress").useRoadmapProgress;
} catch {}

export default function HomeGalaxy() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sphereAnchorRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const frameRef = useRef<number>(0);

  const progress = (useRoadmapProgress ? useRoadmapProgress() : { progress: 0.1 }).progress ?? 0.1;

  useEffect(() => {
    const mount = mountRef.current!;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 2.2, 6);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Galaxy background (very light – looks classy on your dark UI)
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.2) * 60 - 10;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starsMat = new THREE.PointsMaterial({ size: 0.05, color: 0x9fb3ff, opacity: 0.75, transparent: true });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Path curve (Catmull-Rom). We can swap this with content-driven waypoints later.
    const pts = [
      new THREE.Vector3(-2.5, -1.0, -2.0),
      new THREE.Vector3(-1.0, -0.4, -0.8),
      new THREE.Vector3(0.2, 0.2, 0.0),
      new THREE.Vector3(1.2, 0.6, 0.6),
      new THREE.Vector3(2.0, 0.2, 1.8),
      new THREE.Vector3(2.5, -0.2, 3.0),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    curveRef.current = curve;

    // Tube for the “road”
    const tube = new THREE.TubeGeometry(curve, 200, 0.12, 16, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6ea8ff"),
      roughness: 0.35,
      metalness: 0.65,
      emissive: new THREE.Color("#1c2a52"),
      emissiveIntensity: 0.4,
    });
    const tubeMesh = new THREE.Mesh(tube, tubeMat);
    scene.add(tubeMesh);

    // Soft lighting
    const hemi = new THREE.HemisphereLight(0xaabbee, 0x222233, 0.9);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    // Resize
    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Project a 3D point on the path to 2D and place the sphere anchor
    const placeSphere = (t: number) => {
      if (!curveRef.current || !cameraRef.current || !rendererRef.current || !sphereAnchorRef.current) return;
      const point = curveRef.current.getPointAt(t % 1); // keep in [0,1)
      const ndc = point.clone().project(cameraRef.current);
      const { clientWidth: w, clientHeight: h } = mount;
      const x = (ndc.x * 0.5 + 0.5) * w;
      const y = (-ndc.y * 0.5 + 0.5) * h;
      sphereAnchorRef.current.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    };

    // Animate
    const start = performance.now();
    const tick = () => {
      frameRef.current = requestAnimationFrame(tick);
      const t = (performance.now() - start) * 0.00005; // slow drift
      stars.rotation.y += 0.0006;
      // Ease toward real progress so it animates when user completes tasks
      const eased = THREE.MathUtils.damp(t % 1, progress, 0.05, 1 / 60);
      placeSphere(eased);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      starsGeo.dispose();
      tube.dispose();
    };
  }, [progress]);

  const openSphere = () => {
    // Reuse your ModalHost wiring. If you use an event bus, replace this with it.
    window.dispatchEvent(new CustomEvent("ui:openModal", { detail: "sphere-full" }));
  };

  return (
    <div className="galaxy-home h-full w-full relative overflow-hidden">
      {/* THREE mount */}
      <div ref={mountRef} className="absolute inset-0" />
      {/* AuroraSphere pinned to curve (HTML overlay) */}
      <div
        ref={sphereAnchorRef}
        className="absolute top-0 left-0 will-change-transform z-[5] cursor-pointer"
        onClick={openSphere}
      >
        <AuroraSphere size={64} />
      </div>

      {/* Optional: title card or CTA at top */}
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[4] flex justify-between">
        <h1 className="text-lg md:text-xl font-semibold opacity-90">Your Roadmap</h1>
      </div>
    </div>
  );
}

