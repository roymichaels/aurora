// [AURORA-BEGIN:visual-seed]
export type SeedParams = {
  wallet: string;
  personaTone: string;
  createdAt: string | number | Date;
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

export function makeSeed({ wallet, personaTone, createdAt }: SeedParams): number {
  const ts = new Date(createdAt).toISOString();
  return hashString(`${wallet}|${personaTone}|${ts}`);
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paletteFromSeed(params: SeedParams): string[] {
  const seed = makeSeed(params);
  const rand = mulberry32(seed);
  const baseHue = Math.floor(rand() * 360);
  return Array.from({ length: 5 }, (_, i) => `hsl(${(baseHue + i * 72) % 360} 70% 50%)`);
}
// [AURORA-END:visual-seed]
