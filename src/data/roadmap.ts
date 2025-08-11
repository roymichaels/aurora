export type RoadmapNodeType = "hypnosis" | "focus" | "browser" | "analyze" | "coach" | "note" | "reward";

export type RoadmapNode = {
  id: string;
  label: string;
  subtitle?: string;
  type: RoadmapNodeType;
  locked?: boolean;
  minutes?: number;
  duration?: number;
  url?: string;
  script?: string;
};

export type Track = { id: string; label: string; nodes: RoadmapNode[] };

import { defaultHypnosisScripts } from "./hypno/scripts";

export const tracks: Track[] = [
  {
    id: "mind",
    label: "Mind Power",
    nodes: [
      {
        id: "hypno-calm-60",
        label: "Calm Induction",
        type: "hypnosis",
        duration: 60,
        script: defaultHypnosisScripts.calm,
      },
      { id: "coach-intro", label: "Coach: Setup", type: "coach" },
      { id: "reward-1", label: "Reward: Orb Glow", type: "reward" },
      {
        id: "hypno-focus-120",
        label: "Focus Induction",
        type: "hypnosis",
        duration: 120,
        locked: true,
        script: defaultHypnosisScripts.focus,
      },
      {
        id: "hypno-confidence-90",
        label: "Confidence Boost",
        type: "hypnosis",
        duration: 90,
        locked: true,
        script: defaultHypnosisScripts.confidence,
      },
    ],
  },
  {
    id: "focus",
    label: "Focus",
    nodes: [
      { id: "focus-25", label: "Focus 25m", type: "focus", minutes: 25 },
      { id: "focus-45", label: "Focus 45m", type: "focus", minutes: 45 },
      { id: "note-quick", label: "Quick Note", type: "note" },
      { id: "analyze-recap", label: "Analyze Recent", type: "analyze" },
    ],
  },
  {
    id: "work",
    label: "Work",
    nodes: [
      { id: "browser-notion", label: "Open Notion", type: "browser", url: "https://www.notion.so/" },
      { id: "browser-youtube", label: "Open YouTube", type: "browser", url: "https://www.youtube.com/" },
      { id: "browser-docs", label: "Open Docs", type: "browser", url: "https://docs.google.com/" },
      { id: "reward-2", label: "Reward: Token", type: "reward" },
    ],
  },
];

export function getNodeById(id: string) {
  for (const t of tracks) {
    const f = t.nodes.find((n) => n.id === id);
    if (f) return f;
  }
  return null;
}
