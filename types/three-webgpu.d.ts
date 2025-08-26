declare module 'three/webgpu' {
  import * as THREE from 'three';
  export * from 'three';
  export class WebGPURenderer extends THREE.WebGLRenderer {
    init(): void;
    backend: any;
  }
  export class MeshStandardNodeMaterial extends THREE.MeshStandardMaterial {}
}
