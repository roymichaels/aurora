import { useState } from "react";
import { useWeeklyKpiEntry } from "@/hooks/useWeeklyKpiEntry";

interface Props {
  userId: string;
  missionId: string;
  kpiId: string;
  name: string;
}

export function WeeklyKpiEntry({ userId, missionId, kpiId, name }: Props) {
  const { shouldPrompt, record } = useWeeklyKpiEntry(userId, missionId, kpiId);
  const [value, setValue] = useState("");

  if (!shouldPrompt) return null;

  return (
    <div className="p-4 border rounded-md space-y-2">
      <div className="font-semibold">Update {name}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border p-1 rounded w-full"
      />
      <button
        onClick={() => value && record(parseFloat(value), "manual")}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        Save
      </button>
    </div>
  );
}
