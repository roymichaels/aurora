import { useEffect } from "react";
import { memoryStore } from "@/memory/indexedDbMemory";
import { usePersonaStore } from "@/state/persona";
import { scheduleTrigger, getTriggerPreference } from "@/lib/triggers";

const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_KEY = "dailyCheckIn.last";
const SUMMARY_KEY = "dailyCheckIn.lastSummary";

function extract(label: string, content: string) {
  const m = content.match(new RegExp(`${label}:([^\n]+)`));
  return m ? m[1].trim() : "";
}

async function runCheckIn() {
  const mood = window.prompt("How's your mood today?") || "";
  const wins = window.prompt("What were your wins today?") || "";
  const blockers = window.prompt("Any blockers today?") || "";
  if (!mood && !wins && !blockers) return;
  await memoryStore.add(
    "episodic",
    "user",
    `Mood: ${mood}\nWins: ${wins}\nBlockers: ${blockers}`,
    { mood, tags: ["daily-checkin"] }
  );
  const { profile, updateProfile } = usePersonaStore.getState();
  updateProfile({
    history: [
      ...profile.history,
      {
        question: "Daily check-in",
        answer: `Mood: ${mood}; Wins: ${wins}; Blockers: ${blockers}`,
        timestamp: new Date().toISOString(),
      },
    ],
  });
  localStorage.setItem(LAST_KEY, new Date().toISOString());
}

function scheduleNextCheckIn() {
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0); // 8pm local time
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  window.setTimeout(async () => {
    const delivery = getTriggerPreference();
    scheduleTrigger({
      message: "Time for your daily reflection",
      schedule: new Date(),
      delivery,
    });
    await runCheckIn();
    scheduleNextCheckIn();
  }, delay);
}

async function maybeWeeklySummary() {
  const last = localStorage.getItem(SUMMARY_KEY);
  const now = new Date();
  if (last && now.getTime() - new Date(last).getTime() < 7 * DAY_MS) return;
  const entries = await memoryStore.search("", 50, "episodic", ["daily-checkin"]);
  const week = entries.filter((e) => now.getTime() - e.timestamp < 7 * DAY_MS);
  if (!week.length) return;
  const moods = week.map((e) => e.mood).filter(Boolean).join(", ");
  const wins = week.map((e) => extract("Wins", e.content)).filter(Boolean).join("; ");
  const blockers = week
    .map((e) => extract("Blockers", e.content))
    .filter(Boolean)
    .join("; ");
  const delivery = getTriggerPreference();
  scheduleTrigger({
    message: `Weekly reflection summary\nMoods: ${moods}\nWins: ${wins}\nBlockers: ${blockers}`,
    schedule: new Date(),
    delivery,
  });
  localStorage.setItem(SUMMARY_KEY, now.toISOString());
}

export default function useDailyCheckIn() {
  useEffect(() => {
    const last = localStorage.getItem(LAST_KEY);
    if (!last || new Date(last).toDateString() !== new Date().toDateString()) {
      scheduleNextCheckIn();
    }
    maybeWeeklySummary();
  }, []);
}

