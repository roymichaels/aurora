export const defaultHypnosisScripts = {
  calm: `Close your eyes and take a slow, deep breath. With each exhale, feel your shoulders drop and your mind grow quieter. Allow a gentle wave of relaxation to flow from the top of your head down to your toes. You are calm, centered, and safe.`,
  focus: `Let your attention settle on the rhythm of your breathing. Each inhale brings clarity; each exhale releases distraction. See your goals ahead of you and feel a steady determination guiding you forward. Your mind is sharp and focused.`,
  confidence: `Picture a warm light glowing in your chest, growing brighter with every breath. It spreads through your body, filling you with strength and certainty. You carry this confidence with you, ready to face any challenge.`
} as const;

export type HypnosisScriptId = keyof typeof defaultHypnosisScripts;

export function getHypnosisScript(id: HypnosisScriptId): string {
  return defaultHypnosisScripts[id];
}
