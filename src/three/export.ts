// [AURORA-BEGIN:three-export]
import type { Scene } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Export a Three.js scene to a GLB binary blob.
 *
 * @param scene - The scene to export.
 * @returns A promise that resolves with the GLB blob.
 */
export function exportSceneToGLB(scene: Scene): Promise<Blob> {
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    try {
      exporter.parse(
        scene,
        (result) => {
          try {
            const arrayBuffer = result as ArrayBuffer;
            const blob = new Blob([arrayBuffer], {
              type: 'model/gltf-binary',
            });
            resolve(blob);
          } catch (err) {
            reject(err);
          }
        },
        (error) => reject(error),
        { binary: true },
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Export a canvas element to a PNG image blob.
 *
 * @param canvas - The canvas to export.
 * @returns A promise that resolves with the PNG blob.
 */
export function exportCanvasToPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas conversion returned null'));
          }
        },
        'image/png',
      );
    } catch (err) {
      reject(err);
    }
  });
}

// [AURORA-END:three-export]
