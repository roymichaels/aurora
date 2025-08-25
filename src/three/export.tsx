// [AURORA-BEGIN:three-export]
import { useEffect, useState } from 'react';
import { ComposedIdentityScene, ComposedIdentitySceneProps } from './ComposedIdentityScene';
import { onVisualEvent } from '@/visual/events';
import { useProgressStore } from '@/state/progress';
import { useAvatarStore } from '@/state/avatar';
import type { AvatarMood } from '@/state/avatar';
import { AuroraMood } from '@/components/avatar/AuroraSphere';
import HoloBrain from './HoloBrain';
import type { Scene } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const toAuroraMood = (mood: AvatarMood): AuroraMood =>
  mood === 'focused' ? 'focused' : 'calm';

export function IdentityVisualizer() {
  const { xp, streak } = useProgressStore((s) => ({ xp: s.xp, streak: s.streak }));
  const avatarMood = useAvatarStore((s) => s.mood);
  const auroraMood = toAuroraMood(avatarMood);
  const [props, setProps] = useState<ComposedIdentitySceneProps>({
    xp,
    streak,
    mood: auroraMood,
  });

  useEffect(() => setProps({ xp, streak, mood: auroraMood }), [xp, streak, auroraMood]);

  useEffect(() =>
    onVisualEvent('xp-total-update', (e) =>
      setProps((p) => ({ ...p, xp: e.detail.total_xp, streak: e.detail.streak ?? p.streak })),
    ), []);

  return <ComposedIdentityScene {...props} />;
}

export { ComposedIdentityScene } from './ComposedIdentityScene';
export { default as HoloBrain } from './HoloBrain';

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
