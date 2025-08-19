import type { OnboardingMessage, RoadmapDraft } from "@/state/onboarding";

export interface RoadmapDraftUpdate {
  message: string;
  milestone: { id: string; title: string; tasks: string[] };
}

export async function proposeNextStep(
  threadId: string,
  messages: OnboardingMessage[],
): Promise<RoadmapDraftUpdate> {
  void threadId;
  void messages;
  await new Promise((r) => setTimeout(r, 600));
  return {
    message:
      "Let's start with a 'Warm-up routine' milestone: 5-minute stretch, 10 push-ups, short meditation.",
    milestone: {
      id: crypto.randomUUID(),
      title: "Warm-up routine",
      tasks: ["5-minute stretch", "10 push-ups", "Short meditation"],
    },
  };
}

export async function finalizeMilestone(_draft: RoadmapDraft): Promise<void> {
  void _draft;
  await new Promise((r) => setTimeout(r, 400));
}

