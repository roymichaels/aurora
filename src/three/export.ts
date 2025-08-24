// [AURORA-BEGIN:three-export]
import { useEffect, useState } from 'react';
import { ComposedIdentityScene, ComposedIdentitySceneProps } from './ComposedIdentityScene';
import { onVisualEvent } from '@/visual/events';
import { useProgressStore } from '@/state/progress';
import { useAvatarStore } from '@/state/avatar';
import HoloBrain from './HoloBrain';

export function IdentityVisualizer() {
  const { xp, streak } = useProgressStore((s) => ({ xp: s.xp, streak: s.streak }));
  const mood = useAvatarStore((s) => s.mood);
  const [props, setProps] = useState<ComposedIdentitySceneProps>({ xp, streak, mood });

  useEffect(() => setProps({ xp, streak, mood }), [xp, streak, mood]);

  useEffect(() =>
    onVisualEvent('xp-total-update', (e) =>
      setProps((p) => ({ ...p, xp: e.detail.total_xp, streak: e.detail.streak ?? p.streak })),
    ), []);

  return <ComposedIdentityScene {...props} />;
}

export { ComposedIdentityScene } from './ComposedIdentityScene';
export { default as HoloBrain } from './HoloBrain';
// [AURORA-END:three-export]
