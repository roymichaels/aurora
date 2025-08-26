declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import * as THREE from 'three';
  export class OrbitControls {
    constructor(camera: THREE.Camera, domElement: HTMLElement);
    update(): void;
    enableDamping: boolean;
    enablePan: boolean;
    dispose(): void;
  }
}
declare module 'three/examples/jsm/loaders/RGBELoader.js' {
  import * as THREE from 'three';
  export class RGBELoader {
    load(
      url: string,
      onLoad: (t: THREE.DataTexture) => void,
      onProgress?: () => void,
      onError?: (err: unknown) => void
    ): void;
  }
}
declare module 'three/examples/jsm/exporters/GLTFExporter.js' {
  import type { Scene } from 'three';
  export class GLTFExporter {
    parse(
      input: Scene,
      onSuccess: (gltf: ArrayBuffer | Record<string, unknown>) => void,
      onError?: (error: unknown) => void,
      options?: Record<string, unknown>
    ): void;
  }
}
