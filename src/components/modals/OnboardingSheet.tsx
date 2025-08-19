import { useState } from "react";
import { useChatStore } from "@/state/chat";
import { RoadmapBuilder } from "@/ai/RoadmapBuilder";

export default function OnboardingSheet({ onClose }: { onClose: () => void }) {
  const [mood, setMood] = useState("");
  const [goal, setGoal] = useState("");
  const pushUser = useChatStore((s) => s.pushUser);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    pushUser(`Mood: ${mood}. Initial goal: ${goal}`);
    await RoadmapBuilder.seedRoadmap({ mood, goal });
    onClose();
  };

  return (
    <div className="sheet">
      <div className="sheet__title">Let’s set your course</div>
      <form onSubmit={submit} className="sheet__body grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">How’s your mood today?</span>
          <input
            className="input"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g., a bit anxious but excited"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">One thing to improve this month</span>
          <input
            className="input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., daily hypnosis routine"
            required
          />
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn ghost" onClick={onClose}>
            Not now
          </button>
          <button type="submit" className="btn primary">
            Start
          </button>
        </div>
      </form>
    </div>
  );
}
