// [AURORA-BEGIN:three-identity]
import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';
import { AuroraSphere, AuroraMood } from '@/components/avatar/AuroraSphere';
import HoloBrain from './HoloBrain';
import { makeSeed, paletteFromSeed } from '@/visual/seed';

export interface ComposedIdentitySceneProps {
  xp: number;
  streak: number;
  mood: AuroraMood;
}

export function ComposedIdentityScene({ xp, streak, mood }: ComposedIdentitySceneProps) {
  const seedParams = useMemo(
    () => ({ wallet: String(xp), personaTone: mood, createdAt: streak }),
    [xp, streak, mood]
  );
  const seed = useMemo(() => makeSeed(seedParams), [seedParams]);
  const palette = useMemo(() => paletteFromSeed(seedParams), [seedParams]);

  const level = Math.floor(xp / 100) + 1;
  const xpPct = xp % 100;
  const pulse = 1 + streak * 0.1;
  const particles = Math.min(500 + xp, 2000);
  const color = palette[0];

  return (
    <div className="relative w-full h-full">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 4], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <HoloBrain seed={seed} color={color} pulse={pulse} particles={particles} />
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.2} intensity={0.8} />
          <FXAA />
        </EffectComposer>
      </Canvas>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AuroraSphere level={level} xpPct={xpPct} mood={mood} size={220} />
      </div>
    </div>
  );
}

export default ComposedIdentityScene;
// [AURORA-END:three-identity]
